import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseEntityIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      throw new BadRequestException('Invalid entity ID');
    }
    return value.trim();
  }
}
