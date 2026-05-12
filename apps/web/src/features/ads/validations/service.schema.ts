import { z } from 'zod';

export const serviceListingSchema = z.object({
  title:             z.string().min(3, { message: 'أدخل اسم الخدمة (3 أحرف على الأقل).' }),
  description:       z.string().min(10, { message: 'أدخل وصف الخدمة (10 أحرف على الأقل).' }),
  serviceType:       z.string().min(1, { message: 'اختر نوع الخدمة.' }),
  providerType:      z.string().min(1, { message: 'اختر نوع المزوّد.' }),
  providerName:      z.string().min(1, { message: 'أدخل اسم المزوّد.' }),
  specializations:   z.array(z.string()).optional(),
  priceFrom:         z.coerce.number().optional(),
  priceTo:           z.coerce.number().optional(),
  isHomeService:     z.boolean().optional(),
  currency:          z.string().default('OMR'),
  workingHoursOpen:  z.string().optional(),
  workingHoursClose: z.string().optional(),
  workingDays:       z.array(z.string()).optional(),
  governorate:       z.string().min(1, { message: 'اختر المحافظة.' }),
  city:              z.string().optional(),
  address:           z.string().optional(),
  latitude:          z.number().nullable().optional(),
  longitude:         z.number().nullable().optional(),
  contactPhone:      z.string().optional(),
  whatsapp:          z.string().optional(),
  website:           z.string().optional(),
}).superRefine((data, ctx) => {
  if (
    data.priceFrom !== undefined && data.priceFrom > 0 &&
    data.priceTo !== undefined && data.priceTo > 0 &&
    data.priceTo < data.priceFrom
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'السعر الأقصى يجب أن يكون أكبر من الأدنى.',
      path: ['priceTo'],
    });
  }
});

export type ValidatedServiceListing = z.infer<typeof serviceListingSchema>;
