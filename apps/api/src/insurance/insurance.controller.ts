import { Controller, All, GoneException } from '@nestjs/common';

/**
 * Insurance feature has been removed.
 * All routes return 410 Gone for backward compatibility.
 */
@Controller('insurance')
export class InsuranceController {
  @All('*')
  gone() {
    throw new GoneException('خدمة التأمين لم تعد متوفرة');
  }

  @All()
  goneRoot() {
    throw new GoneException('خدمة التأمين لم تعد متوفرة');
  }
}
