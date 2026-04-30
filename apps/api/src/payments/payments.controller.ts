import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  Headers,
  UseGuards,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Request } from 'express';
import { PAYMENT_WEBHOOK_QUEUE } from './payment-webhook.processor';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/auth.types';
import { PaymentsService } from './payments.service';
import { CreateFeaturedPaymentDto } from './dto/create-featured-payment.dto';
import { CreateSubscriptionPaymentDto } from './dto/create-subscription-payment.dto';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    @InjectQueue(PAYMENT_WEBHOOK_QUEUE) private readonly webhookQueue: Queue,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('featured')
  createFeatured(
    @Body() dto: CreateFeaturedPaymentDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    return this.paymentsService.createFeaturedPayment(dto, user.sub, ip, idempotencyKey);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  createSubscription(
    @Body() dto: CreateSubscriptionPaymentDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string);
    return this.paymentsService.createSubscriptionPayment(dto, user.sub, ip, idempotencyKey);
  }

  @Get('verify/:sessionId')
  verify(@Param('sessionId') sessionId: string) {
    return this.paymentsService.verifyPayment(sessionId);
  }

  @Post('webhook')
  async webhook(
    @Body() body: any,
    @Headers('x-thawani-secret') secret?: string,
  ) {
    const expectedSecret = process.env.THAWANI_WEBHOOK_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      this.logger.warn('Webhook rejected — invalid secret');
      throw new ForbiddenException('Invalid webhook secret');
    }
    await this.webhookQueue.add(
      { body },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
    return { received: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  myPayments(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.myPayments(user.sub);
  }

  @Get('plans')
  getPlans() {
    return this.paymentsService.getPlans();
  }

  @UseGuards(JwtAuthGuard)
  @Get('subscription')
  mySubscription(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.mySubscription(user.sub);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('subscription/cancel')
  cancelSubscription(@CurrentUser() user: JwtPayload) {
    return this.paymentsService.cancelSubscription(user.sub);
  }
}
