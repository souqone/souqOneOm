import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class BookingPricingService {
  calculatePrice(
    totalDays: number,
    dailyPrice?: number | null,
    weeklyPrice?: number | null,
    monthlyPrice?: number | null,
  ): { totalPrice: number; breakdown: string } {
    if (!dailyPrice && !weeklyPrice && !monthlyPrice) {
      throw new BadRequestException('لا توجد أسعار إيجار محددة لهذا الإعلان');
    }

    const daily = dailyPrice ? Number(dailyPrice) : Infinity;
    const weekly = weeklyPrice ? Number(weeklyPrice) / 7 : Infinity;
    const monthly = monthlyPrice ? Number(monthlyPrice) / 30 : Infinity;

    let totalPrice: number;
    let breakdown: string;

    if (totalDays >= 30 && monthly !== Infinity) {
      const months = Math.floor(totalDays / 30);
      const remainingDays = totalDays % 30;
      const monthCost = months * Number(monthlyPrice);
      const dayCost = remainingDays * Math.min(daily, weekly);
      totalPrice = monthCost + dayCost;
      breakdown = `${months} شهر × ${monthlyPrice} ر.ع.`;
      if (remainingDays > 0) breakdown += ` + ${remainingDays} يوم`;
    } else if (totalDays >= 7 && weekly !== Infinity) {
      const weeks = Math.floor(totalDays / 7);
      const remainingDays = totalDays % 7;
      const weekCost = weeks * Number(weeklyPrice);
      const dayCost = remainingDays * daily;
      totalPrice = weekCost + (daily !== Infinity ? dayCost : 0);
      breakdown = `${weeks} أسبوع × ${weeklyPrice} ر.ع.`;
      if (remainingDays > 0 && daily !== Infinity) breakdown += ` + ${remainingDays} يوم`;
    } else {
      totalPrice = totalDays * daily;
      breakdown = `${totalDays} يوم × ${dailyPrice} ر.ع.`;
    }

    return { totalPrice: Math.round(totalPrice * 1000) / 1000, breakdown };
  }
}
