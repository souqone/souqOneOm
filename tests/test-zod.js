import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  fromGovernorate: z.string({ message: 'المحافظة مطلوبة' }).min(1, 'المحافظة مطلوبة'),
});

const resolver = zodResolver(schema);

async function test() {
  const data = {
    // empty object simulating what RHF has before user interaction
  };
  
  const result = await resolver(data, undefined, {
    fields: { fromGovernorate: { name: 'fromGovernorate', ref: {} } },
    criteriaMode: 'firstError',
    shouldUseNativeValidation: false
  });
  
  console.log("Empty object result:", JSON.stringify(result, null, 2));

  const data2 = {
    fromGovernorate: ""
  };
  const result2 = await resolver(data2, undefined, {
    fields: { fromGovernorate: { name: 'fromGovernorate', ref: {} } },
    criteriaMode: 'firstError',
    shouldUseNativeValidation: false
  });
  console.log("Empty string result:", JSON.stringify(result2, null, 2));
}

test();
