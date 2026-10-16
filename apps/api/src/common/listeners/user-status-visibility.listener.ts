import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  USER_STATUS_CHANGED,
  UserStatusChangedPayload,
} from '../events/user-status.events';
import { OwnerContentVisibilityService } from '../services/owner-content-visibility.service';

@Injectable()
export class UserStatusVisibilityListener {
  private readonly logger = new Logger(UserStatusVisibilityListener.name);

  constructor(
    private readonly visibilityService: OwnerContentVisibilityService,
  ) {}

  @OnEvent(USER_STATUS_CHANGED, { async: true })
  async handleUserStatusChanged(payload: UserStatusChangedPayload): Promise<void> {
    try {
      if (!payload || !payload.userId) {
        return;
      }

      // No status change occurred (same before and after)
      if (payload.previousStatus === payload.status) {
        this.logger.debug(
          `UserStatusVisibilityListener: status unchanged (${payload.status}) for user ${payload.userId} — skipping`,
        );
        return;
      }

      if (payload.status === 'ACTIVE') {
        this.logger.log(
          `User ${payload.userId} transitioned to ACTIVE from ${payload.previousStatus} — restoring owned content`,
        );
        const result = await this.visibilityService.restoreAllForUser(payload.userId);
        this.logger.log(
          `Restored ${result.totalAffected} items across verticals for user ${payload.userId}`,
        );
      } else {
        // Status transitioned to SUSPENDED, BANNED, DELETED, or any non-ACTIVE state
        this.logger.log(
          `User ${payload.userId} transitioned to ${payload.status} from ${payload.previousStatus} — hiding owned content`,
        );
        const result = await this.visibilityService.hideAllForUser(payload.userId);
        this.logger.log(
          `Hidden ${result.totalAffected} items across verticals for user ${payload.userId}`,
        );
      }
    } catch (err: any) {
      // Catch and log — must never throw or disrupt the event emitter cycle
      this.logger.error(
        `Error handling ${USER_STATUS_CHANGED} for user ${payload?.userId}: ${err.message}`,
        err.stack,
      );
    }
  }
}
