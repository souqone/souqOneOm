import { z } from 'zod';

export const partListingSchema = z.object({
  title:             z.string().min(3, { message: 'العنوان يجب أن يكون 3 أحرف على الأقل.' }),
  description:       z.string().optional(),
  partCategory:      z.string().min(1, { message: 'اختر فئة القطعة.' }),
  condition:         z.string().optional(),
  price:             z.coerce.number().positive({ message: 'أدخل السعر.' }),
  isPriceNegotiable: z.boolean().optional(),
  currency:          z.string().default('OMR'),
  partNumber:        z.string().optional(),
  compatibleMakes:   z.array(z.string()).optional(),
  compatibleModels:  z.array(z.string()).optional(),
  yearFrom:          z.coerce.number().optional(),
  yearTo:            z.coerce.number().optional(),
  isOriginal:        z.boolean().optional(),
  governorate:       z.string().optional(),
  city:              z.string().optional(),
  latitude:          z.number().nullable().optional(),
  longitude:         z.number().nullable().optional(),
  contactPhone:      z.string().optional(),
  whatsapp:          z.string().optional(),
});

export type ValidatedPartListing = z.infer<typeof partListingSchema>;
