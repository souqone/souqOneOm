import { z } from 'zod';

export const carListingSchema = z.object({
  title: z
    .string()
    .min(10, { message: 'عنوان الإعلان يجب أن يكون 10 أحرف على الأقل.' })
    .max(100, { message: 'عنوان الإعلان يجب ألا يتجاوز 100 حرف.' }),

  make: z.string().min(1, { message: 'يرجى اختيار الماركة.' }),
  model: z.string().min(1, { message: 'يرجى اختيار الموديل.' }),

  year: z.coerce
    .number()
    .int()
    .min(1980, { message: 'سنة الصنع غير صالحة (الحد الأدنى 1980).' })
    .max(2026, { message: 'سنة الصنع غير صالحة.' }),

  price: z.coerce
    .number()
    .nonnegative({ message: 'السعر يجب أن يكون رقماً إيجابياً.' }),

  currency: z.string().default('OMR'),

  mileage: z.coerce.number().optional(),
  fuelType: z.string().optional(),
  transmission: z.string().optional(),
  condition: z.string().optional(),
  bodyType: z.string().optional(),
  exteriorColor: z.string().optional(),
  interiorColor: z.string().optional(),
  interior: z.string().optional(),
  features: z.array(z.string()).optional(),

  engineSize: z.string().optional(),
  horsepower: z.coerce.number().optional(),
  doors: z.coerce.number().optional(),
  seats: z.coerce.number().optional(),
  driveType: z.string().optional(),

  description: z.string().optional(),
  governorate: z.string().optional(),
  city: z.string().optional(),

  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),

  isPriceNegotiable: z.boolean().default(false),
  listingType: z.enum(['SALE', 'RENTAL', 'WANTED']),

  dailyPrice: z.coerce.number().optional(),
  weeklyPrice: z.coerce.number().optional(),
  monthlyPrice: z.coerce.number().optional(),
  minRentalDays: z.coerce.number().optional(),
  depositAmount: z.coerce.number().optional(),
  kmLimitPerDay: z.coerce.number().optional(),
  withDriver: z.boolean().optional(),
  deliveryAvailable: z.boolean().optional(),
  insuranceIncluded: z.boolean().optional(),
  cancellationPolicy: z.string().optional(),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),

  whatsapp: z.string().optional(),
  contactPhone: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.listingType === 'SALE' && data.price <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'سعر البيع مطلوب ولا يمكن أن يكون صفراً.',
      path: ['price'],
    });
  }

  if (data.listingType === 'RENTAL' && (!data.dailyPrice || data.dailyPrice <= 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'سعر الإيجار اليومي مطلوب ولا يمكن أن يكون صفراً.',
      path: ['dailyPrice'],
    });
  }
});

export type ValidatedCarListing = z.infer<typeof carListingSchema>;
