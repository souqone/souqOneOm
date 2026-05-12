import { z } from 'zod';

export const operatorListingSchema = z.object({
  title:            z.string().min(3, { message: 'العنوان يجب أن يكون 3 أحرف على الأقل.' }),
  description:      z.string().min(10, { message: 'الوصف يجب أن يكون 10 أحرف على الأقل.' }),
  operatorType:     z.string().min(1, { message: 'اختر نوع المشغّل.' }),
  specializations:  z.array(z.string()).optional(),
  certifications:   z.array(z.string()).optional(),
  equipmentTypes:   z.array(z.string()).optional(),
  experienceYears:  z.coerce.number().optional(),
  dailyRate:        z.coerce.number().optional(),
  hourlyRate:       z.coerce.number().optional(),
  isPriceNegotiable: z.boolean().optional(),
  currency:         z.string().default('OMR'),
  governorate:      z.string().min(1, { message: 'اختر المحافظة.' }),
  city:             z.string().optional(),
  latitude:         z.number().nullable().optional(),
  longitude:        z.number().nullable().optional(),
  contactPhone:     z.string().optional(),
  whatsapp:         z.string().optional(),
});

export type ValidatedOperatorListing = z.infer<typeof operatorListingSchema>;
