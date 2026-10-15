import 'reflect-metadata';
import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA, GUARDS_METADATA } from '@nestjs/common/constants';
import {
  ADMIN_KEY_ROUTES,
  PUBLIC_ROUTES_ALLOWLIST,
} from '../../constants/public-routes.allowlist';

// Import all 25 controllers
import { AppController } from '../../../app.controller';
import { AuthController } from '../../../auth/auth.controller';
import { BusesController } from '../../../buses/buses.controller';
import { CarsController } from '../../../cars/cars.controller';
import { ChatController } from '../../../chat/chat.controller';
import { ContactController } from '../../../contact/contact.controller';
import { EquipmentController } from '../../../equipment/equipment.controller';
import { FavoritesController } from '../../../favorites/favorites.controller';
import { AdminJobsController } from '../../../jobs/admin-jobs.controller';
import { JobsController } from '../../../jobs/jobs.controller';
import { ListingsController } from '../../../listings/listings.controller';
import { LocationsController } from '../../../locations/locations.controller';
import { NotificationsController } from '../../../notifications/notifications.controller';
import { AdminOperatorsController } from '../../../operators/admin-operators.controller';
import { OperatorsController } from '../../../operators/operators.controller';
import { PartsController } from '../../../parts/parts.controller';
import { AdminPaymentsController } from '../../../payments/admin-payments.controller';
import { PaymentsController } from '../../../payments/payments.controller';
import { ReviewsController } from '../../../reviews/reviews.controller';
import { SearchController } from '../../../search/search.controller';
import { ServicesController } from '../../../services/services.controller';
import { AdminTransportController } from '../../../transport/admin-transport.controller';
import { TransportController } from '../../../transport/transport.controller';
import { UploadsController } from '../../../uploads/uploads.controller';
import { UsersController } from '../../../users/users.controller';

const ALL_CONTROLLERS = [
  AppController,
  AuthController,
  BusesController,
  CarsController,
  ChatController,
  ContactController,
  EquipmentController,
  FavoritesController,
  AdminJobsController,
  JobsController,
  ListingsController,
  LocationsController,
  NotificationsController,
  AdminOperatorsController,
  OperatorsController,
  PartsController,
  AdminPaymentsController,
  PaymentsController,
  ReviewsController,
  SearchController,
  ServicesController,
  AdminTransportController,
  TransportController,
  UploadsController,
  UsersController,
];

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
  hasAdminKeyGuard: boolean;
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
  adminKeyCount: number;
  publicCount: number;
} {
  const publicAllowlistSet = new Set<string>(PUBLIC_ROUTES_ALLOWLIST);
  const adminKeySet = new Set<string>(ADMIN_KEY_ROUTES);
  const violatingRoutes: RouteEntry[] = [];

  let jwtCount = 0;
  let adminKeyCount = 0;
  let publicCount = 0;

  for (const route of routes) {
    if (route.hasJwtGuard) {
      jwtCount++;
    } else if (route.hasAdminKeyGuard) {
      adminKeyCount++;
      if (!adminKeySet.has(route.routeKey)) {
        violatingRoutes.push(route);
      }
    } else if (publicAllowlistSet.has(route.routeKey)) {
      publicCount++;
    } else {
      violatingRoutes.push(route);
    }
  }

  return { violatingRoutes, jwtCount, adminKeyCount, publicCount };
}

describe('Route Authorization Policy Spec (Automated Route Scanner)', () => {
  let scannedRoutes: RouteEntry[];

  beforeAll(() => {
    scannedRoutes = scanRoutesFromControllers(ALL_CONTROLLERS);
  });

  it('scans all 25 registered controllers and finds 216 total API routes', () => {
    expect(ALL_CONTROLLERS.length).toBe(25);
    expect(scannedRoutes.length).toBe(216);
  });

  it('verifies exact route counts matching architecture plan (146 JWT, 5 AdminKey, 65 Public)', () => {
    const { jwtCount, adminKeyCount, publicCount, violatingRoutes } = validateRoutePolicy(scannedRoutes);

    expect(jwtCount).toBe(146);
    expect(adminKeyCount).toBe(5);
    expect(publicCount).toBe(65);
    expect(violatingRoutes).toHaveLength(0);
  });

  it('enforces that every route without JwtAuthGuard is either in ADMIN_KEY_ROUTES or PUBLIC_ROUTES_ALLOWLIST', () => {
    const { violatingRoutes } = validateRoutePolicy(scannedRoutes);

    if (violatingRoutes.length > 0) {
      const summary = violatingRoutes
        .map(r => `  - ${r.routeKey} (${r.controller}.${r.handler}) [guards: ${r.guards.join(', ') || 'NONE'}]`)
        .join('\n');
      throw new Error(`Found ${violatingRoutes.length} route(s) lacking required auth guard:\n${summary}`);
    }

    expect(violatingRoutes).toHaveLength(0);
  });

  it('ensures all entries in PUBLIC_ROUTES_ALLOWLIST correspond to real controller routes', () => {
    const existingRouteKeys = new Set(scannedRoutes.map(r => r.routeKey));
    const staleRoutes = PUBLIC_ROUTES_ALLOWLIST.filter(routeKey => !existingRouteKeys.has(routeKey));

    expect(staleRoutes).toEqual([]);
    expect(PUBLIC_ROUTES_ALLOWLIST.length).toBe(65);
  });

  it('ensures all entries in ADMIN_KEY_ROUTES are protected by AdminApiKeyGuard and match real routes', () => {
    const existingAdminRoutes = scannedRoutes
      .filter(r => r.hasAdminKeyGuard)
      .map(r => r.routeKey);

    expect(new Set(existingAdminRoutes)).toEqual(new Set(ADMIN_KEY_ROUTES));
    expect(ADMIN_KEY_ROUTES.length).toBe(5);
  });

  it('tear-down failure test: fails immediately if an unauthorized unallowlisted route is introduced', () => {
    // Simulate introducing an un-guarded route that is not in any allowlist
    const rogueRoute: RouteEntry = {
      controller: 'RogueController',
      handler: 'unprotectedEndpoint',
      method: 'DELETE',
      path: '/admin/nuclear-option',
      routeKey: 'DELETE /admin/nuclear-option',
      guards: [],
      hasJwtGuard: false,
      hasAdminKeyGuard: false,
    };

    const routesWithRogue = [...scannedRoutes, rogueRoute];
    const { violatingRoutes } = validateRoutePolicy(routesWithRogue);

    expect(violatingRoutes).toHaveLength(1);
    expect(violatingRoutes[0].routeKey).toBe('DELETE /admin/nuclear-option');
  });
});
