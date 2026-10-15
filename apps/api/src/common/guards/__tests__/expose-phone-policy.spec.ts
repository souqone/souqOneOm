import 'reflect-metadata';
import * as path from 'path';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { EXPOSE_PHONE_KEY } from '../../decorators/expose-phone.decorator';
import {
  EXPOSE_PHONE_ALLOWLIST,
  EXPOSE_PHONE_ROUTE_KEYS,
} from '../../constants/expose-phone.allowlist';
import {
  findControllerFiles,
  loadControllersFromFiles,
  formatPaths,
} from './route-policy.spec';

const METHOD_NAME_MAP: Record<number, string> = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.DELETE]: 'DELETE',
  [RequestMethod.PATCH]: 'PATCH',
  [RequestMethod.ALL]: 'ALL',
  [RequestMethod.OPTIONS]: 'OPTIONS',
  [RequestMethod.HEAD]: 'HEAD',
};

export interface ScannedExposePhoneRoute {
  controller: string;
  handler: string;
  routeKey: string;
  hasExposePhone: boolean;
}

export function scanExposePhoneRoutes(controllers: any[]): ScannedExposePhoneRoute[] {
  const routes: ScannedExposePhoneRoute[] = [];

  for (const ControllerClass of controllers) {
    const controllerPath = Reflect.getMetadata(PATH_METADATA, ControllerClass) || '';
    const classHasExposePhone = Boolean(Reflect.getMetadata(EXPOSE_PHONE_KEY, ControllerClass));

    const prototype = ControllerClass.prototype;
    const propertyNames = Object.getOwnPropertyNames(prototype);

    for (const prop of propertyNames) {
      if (prop === 'constructor') continue;
      const handler = prototype[prop];
      if (typeof handler !== 'function') continue;

      const routePath = Reflect.getMetadata(PATH_METADATA, handler);
      const requestMethod = Reflect.getMetadata(METHOD_METADATA, handler);
      if (requestMethod === undefined) continue;

      const methodHasExposePhone = Boolean(Reflect.getMetadata(EXPOSE_PHONE_KEY, handler));
      const hasExposePhone = classHasExposePhone || methodHasExposePhone;

      const method = METHOD_NAME_MAP[requestMethod] || 'UNKNOWN';
      const paths = formatPaths(controllerPath, routePath);

      for (const p of paths) {
        routes.push({
          controller: ControllerClass.name,
          handler: prop,
          routeKey: `${method} ${p}`,
          hasExposePhone,
        });
      }
    }
  }

  return routes;
}

describe('ExposePhone Policy Dynamic Scanner & Contract Spec', () => {
  const srcDir = path.resolve(__dirname, '../../..');
  const controllerFiles = findControllerFiles(srcDir);
  const { controllers, ignoredFiles } = loadControllersFromFiles(controllerFiles);
  const scannedRoutes = scanExposePhoneRoutes(controllers);

  it('should find controller files and export valid controllers', () => {
    expect(controllerFiles.length).toBeGreaterThan(15);
    expect(controllers.length).toBeGreaterThan(15);
    expect(ignoredFiles.length).toBe(0);
  });

  it('should verify that all routes decorated with @ExposePhone() match the allowlist exactly (1-to-1)', () => {
    const codeExposedRouteKeys = Array.from(
      new Set(
        scannedRoutes
          .filter((r) => r.hasExposePhone)
          .map((r) => r.routeKey),
      ),
    ).sort();

    const allowlistRouteKeys = Array.from(new Set(EXPOSE_PHONE_ROUTE_KEYS)).sort();

    // 1. Check for any route in code with @ExposePhone() that is NOT registered in allowlist
    const undeclaredRoutes = codeExposedRouteKeys.filter(
      (key) => !allowlistRouteKeys.includes(key),
    );

    // 2. Check for any route in allowlist that is MISSING @ExposePhone() in code
    const missingDecorators = allowlistRouteKeys.filter(
      (key) => !codeExposedRouteKeys.includes(key),
    );

    expect(undeclaredRoutes).toEqual([]);
    expect(missingDecorators).toEqual([]);
    expect(codeExposedRouteKeys).toEqual(allowlistRouteKeys);
  });

  it('should ensure every allowlist entry has non-empty controller, handler, and justification', () => {
    for (const entry of EXPOSE_PHONE_ALLOWLIST) {
      expect(entry.routeKey).toBeTruthy();
      expect(entry.controller).toBeTruthy();
      expect(entry.handler).toBeTruthy();
      expect(entry.justification).toBeTruthy();
      expect(entry.justification.trim().length).toBeGreaterThan(10);
    }
  });

  it('should assert that general public browsing endpoints do NOT have @ExposePhone()', () => {
    const sensitivePublicRoutes = [
      'GET /listings',
      'GET /listings/:id',
      'GET /equipment',
      'GET /equipment/:id',
      'GET /buses',
      'GET /buses/:id',
      'GET /parts',
      'GET /parts/:id',
      'GET /services',
      'GET /services/:id',
      'GET /jobs',
      'GET /jobs/:id',
      'GET /jobs/drivers',
      'GET /jobs/drivers/:id',
      'GET /jobs/employers/:id',
      'GET /transport/requests',
      'GET /transport/requests/:id',
      'GET /transport/carriers',
      'GET /transport/carriers/:id',
      'GET /users/:id',
    ];

    for (const pubRoute of sensitivePublicRoutes) {
      const match = scannedRoutes.find((r) => r.routeKey === pubRoute);
      if (match) {
        expect(match.hasExposePhone).toBe(false);
      }
    }
  });
});
