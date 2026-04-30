import { Controller, All, GoneException } from '@nestjs/common';

/**
 * Trips feature has been removed.
 * All routes return 410 Gone for backward compatibility.
 */
@Controller('trips')
export class TripsController {
  @All('*')
  gone() {
    throw new GoneException('خدمة الرحلات لم تعد متوفرة');
  }

  @All()
  goneRoot() {
    throw new GoneException('خدمة الرحلات لم تعد متوفرة');
  }
}
