import { z } from 'zod';

export const createRequestSchema = z.object({
  serviceType: z.enum(['GOODS', 'FURNITURE', 'CONSTRUCTION', 'HEAVY', 'BACKLOAD', 'EQUIPMENT'], {
    message: 'يرجى اختيار نوع الخدمة'
  }),
  fromGovernorate: z.string({ message: 'المحافظة مطلوبة' }).min(1, 'المحافظة مطلوبة'),
  fromCity: z.string().optional(),
  fromAddress: z.string({ message: 'العنوان مطلوب' }).min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل'),
  toGovernorate: z.string({ message: 'المحافظة مطلوبة' }).min(1, 'المحافظة مطلوبة'),
  toCity: z.string().optional(),
  toAddress: z.string({ message: 'العنوان مطلوب' }).min(5, 'العنوان يجب أن يكون 5 أحرف على الأقل'),
  cargoDescription: z.string({ message: 'وصف البضاعة مطلوب' }).min(3, 'الوصف يجب أن يكون 3 أحرف على الأقل'),
  weightTons: z.union([z.string(), z.number()]).optional(),
  requiresHelper: z.boolean().default(false),
  notes: z.string().optional(),
  timingType: z.enum(['asap', 'scheduled'], {
    message: 'نوع الموعد مطلوب'
  }),
  scheduledAt: z.string().optional(),
  isFlexible: z.boolean().default(false),
  budgetMin: z.union([z.string(), z.number()]).optional(),
  budgetMax: z.union([z.string(), z.number()]).optional(),
  fromLat: z.number().nullable().optional(),
  fromLng: z.number().nullable().optional(),
  toLat: z.number().nullable().optional(),
  toLng: z.number().nullable().optional(),
});
