import { z } from 'zod';

export const jobListingSchema = z.object({
  title:           z.string().min(3, { message: 'العنوان يجب أن يكون 3 أحرف على الأقل.' }),
  description:     z.string().min(10, { message: 'الوصف يجب أن يكون 10 أحرف على الأقل.' }),
  jobType:         z.enum(['HIRING', 'OFFERING']),
  employmentType:  z.string().optional(),
  salary:          z.coerce.number().optional(),
  salaryPeriod:    z.string().optional(),
  licenseTypes:    z.array(z.string()).optional(),
  experienceYears: z.coerce.number().optional(),
  minAge:          z.coerce.number().optional(),
  maxAge:          z.coerce.number().optional(),
  languages:       z.array(z.string()).optional(),
  nationality:     z.string().optional(),
  vehicleTypes:    z.array(z.string()).optional(),
  hasOwnVehicle:   z.boolean().optional(),
  currency:        z.string().default('OMR'),
  governorate:     z.string().min(1, { message: 'اختر المحافظة.' }),
  city:            z.string().optional(),
  contactPhone:    z.string().optional(),
  contactEmail:    z.string().optional(),
  whatsapp:        z.string().optional(),
});

export type ValidatedJobListing = z.infer<typeof jobListingSchema>;
