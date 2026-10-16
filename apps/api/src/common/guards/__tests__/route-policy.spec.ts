import 'reflect-metadata';
import * as fs from 'fs';
import * as path from 'path';
import { Controller, Get, RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA, GUARDS_METADATA } from '@nestjs/common/constants';
import {
  PUBLIC_ROUTES_ALLOWLIST,
} from '../../constants/public-routes.allowlist';

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

export interface RouteEntry {
  controller: string;
  handler: string;
  method: string;
  path: string;
  routeKey: string; // e.g. 'GET /listings/:id'
  guards: string[];
  hasJwtGuard: boolean;
  hasRolesGuard: boolean;
  hasAdminKeyGuard: boolean;
}

export interface IgnoredControllerFile {
  filePath: string;
  reason: string;
}

export function formatPaths(basePath: string | string[], routePath: string | string[]): string[] {
  const bases = Array.isArray(basePath) ? basePath : [basePath || ''];
  const routes = Array.isArray(routePath) ? routePath : [routePath || ''];
  const res: string[] = [];

  for (const b of bases) {
    for (const r of routes) {
      const cleanBase = String(b || '').trim().replace(/^\/+|\/+$/g, '');
      const cleanRoute = String(r || '').trim().replace(/^\/+|\/+$/g, '');
      if (!cleanBase && !cleanRoute) res.push('/');
      else if (!cleanBase) res.push(`/${cleanRoute}`);
      else if (!cleanRoute) res.push(`/${cleanBase}`);
      else res.push(`/${cleanBase}/${cleanRoute}`);
    }
  }
  return res;
}

/**
 * Recursively discovers all *.controller.ts files in the given directory.
 */
export function findControllerFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', 'dist', '.git', '__tests__'].includes(entry.name)) continue;
      results.push(...findControllerFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.controller.ts')) {
      results.push(fullPath);
    }
  }

  return results.sort();
}

/**
 * Dynamically loads and extracts all classes decorated with @Controller from the file paths.
 */
export function loadControllersFromFiles(filePaths: string[]): {
  controllers: any[];
  ignoredFiles: IgnoredControllerFile[];
} {
  const controllers: any[] = [];
  const ignoredFiles: IgnoredControllerFile[] = [];

  for (const file of filePaths) {
    const moduleExports = require(file);
    let found = false;

    for (const exp of Object.values(moduleExports)) {
      if (typeof exp === 'function' && Reflect.hasMetadata(PATH_METADATA, exp)) {
        controllers.push(exp);
        found = true;
      }
    }

    if (!found) {
      ignoredFiles.push({
        filePath: file,
        reason: 'File does not export any class decorated with @Controller (PATH_METADATA missing)',
      });
    }
  }

  return { controllers, ignoredFiles };
}

export function scanRoutesFromControllers(controllers: any[]): RouteEntry[] {
  const scanned: RouteEntry[] = [];

  for (const ControllerClass of controllers) {
    const controllerPath = Reflect.getMetadata(PATH_METADATA, ControllerClass) || '';
    const controllerGuards = Reflect.getMetadata(GUARDS_METADATA, ControllerClass) || [];

    const prototype = ControllerClass.prototype;
    const propertyNames = Object.getOwnPropertyNames(prototype);

    for (const prop of propertyNames) {
      if (prop === 'constructor') continue;
      const handler = prototype[prop];
      if (typeof handler !== 'function') continue;

      const routePath = Reflect.getMetadata(PATH_METADATA, handler);
      const requestMethod = Reflect.getMetadata(METHOD_METADATA, handler);

      if (requestMethod === undefined) continue;

      const methodGuards = Reflect.getMetadata(GUARDS_METADATA, handler) || [];
      const combinedGuards = [...controllerGuards, ...methodGuards];
      const guardNames = combinedGuards.map((g: any) => g.name || g.constructor?.name || String(g));

      const hasJwtGuard = guardNames.includes('JwtAuthGuard');
      const hasRolesGuard = guardNames.includes('RolesGuard');
      const hasAdminKeyGuard = guardNames.includes('AdminApiKeyGuard');

      const method = METHOD_NAME_MAP[requestMethod] || 'UNKNOWN';
      const paths = formatPaths(controllerPath, routePath);

      for (const p of paths) {
        scanned.push({
          controller: ControllerClass.name,
          handler: prop,
          method,
          path: p,
          routeKey: `${method} ${p}`,
          guards: guardNames,
          hasJwtGuard,
          hasRolesGuard,
          hasAdminKeyGuard,
        });
      }
    }
  }

  return scanned;
}

export function validateRoutePolicy(routes: RouteEntry[]): {
  violatingRoutes: RouteEntry[];
  jwtCount: number;
  publicCount: number;
} {
  const publicAllowlistSet = new Set<string>(PUBLIC_ROUTES_ALLOWLIST);
  const violatingRoutes: RouteEntry[] = [];

  let jwtCount = 0;
  let publicCount = 0;

  for (const route of routes) {
    if (route.hasJwtGuard) {
      jwtCount++;
    } else if (publicAllowlistSet.has(route.routeKey)) {
      publicCount++;
    } else {
      violatingRoutes.push(route);
    }
  }

  return { violatingRoutes, jwtCount, publicCount };
}

describe('Route Authorization Policy Spec (Dynamic Discovery & Enforcement)', () => {
  const srcDir = path.resolve(__dirname, '../../..');
  let controllerFiles: string[];
  let discoveredControllers: any[];
  let ignoredFiles: IgnoredControllerFile[];
  let scannedRoutes: RouteEntry[];

  beforeAll(() => {
    controllerFiles = findControllerFiles(srcDir);
    const loaded = loadControllersFromFiles(controllerFiles);
    discoveredControllers = loaded.controllers;
    ignoredFiles = loaded.ignoredFiles;
    scannedRoutes = scanRoutesFromControllers(discoveredControllers);
  });

  it('dynamically discovers all *.controller.ts files from disk and verifies 100% export valid @Controller classes', () => {
    expect(controllerFiles.length).toBeGreaterThan(0);
    expect(discoveredControllers.length).toBe(controllerFiles.length);

    if (ignoredFiles.length > 0) {
      const details = ignoredFiles.map(f => `  - ${f.filePath}: ${f.reason}`).join('\n');
      throw new Error(`Found ${ignoredFiles.length} *.controller.ts file(s) that did not export a valid @Controller:\n${details}`);
    }

    expect(ignoredFiles).toEqual([]);
  });

  it('enforces that every route without JwtAuthGuard is in PUBLIC_ROUTES_ALLOWLIST', () => {
    const { violatingRoutes } = validateRoutePolicy(scannedRoutes);

    if (violatingRoutes.length > 0) {
      const summary = violatingRoutes
        .map(
          r =>
            `  ✖ [${r.routeKey}] in ${r.controller}.${r.handler} (Guards: ${r.guards.join(', ') || 'NONE'})\n` +
            `    -> هل تقصد جعل هذا المسار عاماً؟ أضفه صراحة إلى PUBLIC_ROUTES_ALLOWLIST في apps/api/src/common/constants/public-routes.allowlist.ts.\n` +
            `    -> إذا لم يكن عاماً، احمِه بإضافة @UseGuards(JwtAuthGuard) على مستوى الدالة أو الـ Controller.`,
        )
        .join('\n\n');
      throw new Error(`Found ${violatingRoutes.length} route(s) lacking required auth guard:\n\n${summary}`);
    }

    expect(violatingRoutes).toHaveLength(0);
  });

  it('ensures all entries in PUBLIC_ROUTES_ALLOWLIST correspond to real controller routes (no stale entries)', () => {
    const existingRouteKeys = new Set(scannedRoutes.map(r => r.routeKey));
    const staleRoutes = PUBLIC_ROUTES_ALLOWLIST.filter(routeKey => !existingRouteKeys.has(routeKey));

    expect(staleRoutes).toEqual([]);
  });

  it('enforces that no route in the application uses retired AdminApiKeyGuard', () => {
    const routesWithAdminKey = scannedRoutes.filter(r => r.hasAdminKeyGuard);
    expect(routesWithAdminKey).toHaveLength(0);
  });

  it('enforces that all /admin/* routes are strictly protected by JwtAuthGuard and RolesGuard', () => {
    const adminRoutes = scannedRoutes.filter(r => r.path.startsWith('/admin'));
    expect(adminRoutes.length).toBeGreaterThan(0);

    const unprotectedAdminRoutes = adminRoutes.filter(
      r => !r.hasJwtGuard || !r.hasRolesGuard,
    );

    if (unprotectedAdminRoutes.length > 0) {
      const details = unprotectedAdminRoutes
        .map(r => `  ✖ [${r.routeKey}] in ${r.controller}.${r.handler} (Guards: ${r.guards.join(', ') || 'NONE'})`)
        .join('\n');
      throw new Error(`Found /admin/* routes missing JwtAuthGuard or RolesGuard:\n${details}`);
    }

    expect(unprotectedAdminRoutes).toHaveLength(0);
  });

  it('real breaking test: fails immediately when a real undecorated Nest controller route is scanned', () => {
    // Define a real NestJS controller using actual decorators without auth guard
    @Controller('unprotected-dummy-test')
    class UnprotectedDummyTestController {
      @Get('leaked-endpoint')
      leakedHandler() {
        return { status: 'leaked' };
      }
    }

    const dummyRoutes = scanRoutesFromControllers([UnprotectedDummyTestController]);
    expect(dummyRoutes).toHaveLength(1);
    expect(dummyRoutes[0].routeKey).toBe('GET /unprotected-dummy-test/leaked-endpoint');

    const combinedRoutes = [...scannedRoutes, ...dummyRoutes];
    const { violatingRoutes } = validateRoutePolicy(combinedRoutes);

    expect(violatingRoutes).toHaveLength(1);
    expect(violatingRoutes[0].routeKey).toBe('GET /unprotected-dummy-test/leaked-endpoint');
    expect(violatingRoutes[0].controller).toBe('UnprotectedDummyTestController');
    expect(violatingRoutes[0].handler).toBe('leakedHandler');
  });
});
