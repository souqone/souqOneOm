const https = require('https');

async function createJobs() {
  const loginData = JSON.stringify({ email: 'Mahmmouudmuhamed2097@gmail.com', password: '1234512345' });

  const token = await new Promise((resolve, reject) => {
    const req = https.request('https://caroneapi-production.up.railway.app/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(JSON.parse(data).accessToken);
        } else {
          reject(new Error('Login failed: ' + res.statusCode + ' ' + data));
        }
      });
    });
    req.on('error', reject);
    req.write(loginData);
    req.end();
  });

  console.log('Logged in successfully!');

  const jobs = [
    // ────── 5 HIRING ──────
    {
      title: 'مطلوب سائق رخصة ثقيلة لشركة نقليات كبرى بمسقط',
      description: 'نبحث عن سائق محترف حاصل على رخصة قيادة ثقيلة للعمل في شركة نقليات دولية بمحافظة مسقط. يشترط الخبرة في قيادة الشاحنات الكبيرة والالتزام بقواعد السلامة المرورية. نوفر راتب مجزي وسكن ومزايا إضافية.',
      jobType: 'HIRING',
      employmentType: 'FULL_TIME',
      salary: 450,
      salaryPeriod: 'MONTHLY',
      licenseTypes: ['HEAVY'],
      experienceYears: 5,
      minAge: 25,
      maxAge: 45,
      languages: ['Arabic', 'English'],
      nationality: 'Omani Preferred',
      vehicleTypes: ['Truck', 'Trailer'],
      hasOwnVehicle: false,
      governorate: 'OM_MUS',
      city: 'السيب',
      contactPhone: '+96890000001',
      whatsapp: '+96890000001'
    },
    {
      title: 'مطلوب سائق حافلة مدرسية رخصة باص بمنطقة بوشر',
      description: 'مدرسة خاصة في بوشر تطلب سائق حافلة مدرسية ملتزم وأمين. يجب أن يكون حاصلاً على رخصة قيادة باص سارية وسكنه قريب من منطقة العمل. العمل بنظام الفترتين الصباحية والمسائية خلال العام الدراسي. يوجد مكافآت للالتزام.',
      jobType: 'HIRING',
      employmentType: 'FULL_TIME',
      salary: 350,
      salaryPeriod: 'MONTHLY',
      licenseTypes: ['BUS'],
      experienceYears: 3,
      minAge: 30,
      maxAge: 55,
      languages: ['Arabic'],
      nationality: 'Omani',
      vehicleTypes: ['Bus', 'School Bus'],
      hasOwnVehicle: false,
      governorate: 'OM_MUS',
      city: 'بوشر',
      contactPhone: '+96890000002',
      whatsapp: '+96890000002'
    },
    {
      title: 'مطلوب مندوب توصيل بسيارته الخاصة في صلالة',
      description: 'شركة توصيل طرود بارزة في صلالة تطلب مناديب توصيل يمتلكون سياراتهم الخاصة. العمل بنظام العمولة لكل شحنة مع ضمان دخل يومي جيد. يشترط المعرفة التامة بمناطق صلالة واستخدام الخرائط الذكية.',
      jobType: 'HIRING',
      employmentType: 'CONTRACT',
      salary: 600,
      salaryPeriod: 'MONTHLY',
      licenseTypes: ['LIGHT'],
      experienceYears: 1,
      minAge: 21,
      maxAge: 40,
      languages: ['Arabic'],
      vehicleTypes: ['Sedan', 'Van'],
      hasOwnVehicle: true,
      governorate: 'OM_DHO',
      city: 'صلالة',
      contactPhone: '+96890000003',
      whatsapp: '+96890000003'
    },
    {
      title: 'مطلوب سائق خاص لعائلة ببركاء',
      description: 'عائلة عمانية في بركاء تطلب سائق خاص محترم وذو مظهر لائق. يشترط الخبرة في القيادة الآمنة والالتزام بالمواعيد. يفضل من لديه رخصة قيادة خفيفة سارية. مواعيد عمل مرنة وبيئة عمل مريحة.',
      jobType: 'HIRING',
      employmentType: 'FULL_TIME',
      salary: 300,
      salaryPeriod: 'MONTHLY',
      licenseTypes: ['LIGHT'],
      experienceYears: 4,
      minAge: 28,
      maxAge: 50,
      languages: ['Arabic'],
      vehicleTypes: ['SUV'],
      hasOwnVehicle: false,
      governorate: 'OM_BAS',
      city: 'بركاء',
      contactPhone: '+96890000004',
      whatsapp: '+96890000004'
    },
    {
      title: 'مطلوب سائق صهريج مياه بنظام نقل في ولاية نزوى',
      description: 'مطلوب سائق رخصة نقل (Transport) للعمل على صهريج مياه في ولاية نزوى. العمل يومي ومستمر طوال الأسبوع. يجب أن يكون السائق على دراية بالولاية والمناطق المجاورة. نوفر سكن للموظف ووجبات.',
      jobType: 'HIRING',
      employmentType: 'FULL_TIME',
      salary: 400,
      salaryPeriod: 'MONTHLY',
      licenseTypes: ['TRANSPORT'],
      experienceYears: 2,
      minAge: 24,
      maxAge: 50,
      languages: ['Arabic'],
      vehicleTypes: ['Water Tanker'],
      hasOwnVehicle: false,
      governorate: 'OM_DAK',
      city: 'نزوى',
      contactPhone: '+96890000005',
      whatsapp: '+96890000005'
    },
    // ────── 5 OFFERING ──────
    {
      title: 'سائق رخصة ثقيلة ونقل دولي متاح للعمل فوراً في مسقط',
      description: 'سائق عماني حاصل على رخصة قيادة ثقيلة وخبرة 15 عاماً في النقل الدولي بين دول مجلس التعاون الخليجي. أمتلك سجلاً نظيفاً خالياً من الحوادث وأجيد التعامل مع الشحنات الحساسة وعبور المنافذ الجمركية. متاح للعمل فوراً.',
      jobType: 'OFFERING',
      employmentType: 'FULL_TIME',
      salaryPeriod: 'NEGOTIABLE',
      licenseTypes: ['HEAVY', 'TRANSPORT'],
      experienceYears: 15,
      minAge: 40,
      maxAge: 40,
      languages: ['Arabic', 'English'],
      nationality: 'Omani',
      vehicleTypes: ['Truck', 'Trailer'],
      hasOwnVehicle: false,
      governorate: 'OM_MUS',
      contactPhone: '+96890000006',
      whatsapp: '+96890000006'
    },
    {
      title: 'سائق خاص بسيارة حديثة متاح للتعاقد اليومي والشهري في مسقط',
      description: 'أقدم خدمات النقل الخاص بسيارتي الحديثة (تويوتا كامري 2024). متاح لتوصيل الموظفين ورحلات المطار والتنقل اليومي. قيادة هادئة وآمنة والتزام تام بالمواعيد. متاح في محافظة مسقط والولايات المجاورة على مدار الأسبوع.',
      jobType: 'OFFERING',
      employmentType: 'PART_TIME',
      salaryPeriod: 'NEGOTIABLE',
      licenseTypes: ['LIGHT'],
      experienceYears: 8,
      minAge: 32,
      maxAge: 32,
      languages: ['Arabic', 'English'],
      nationality: 'Omani',
      vehicleTypes: ['Luxury Sedan'],
      hasOwnVehicle: true,
      governorate: 'OM_MUS',
      city: 'السيب',
      contactPhone: '+96890000007',
      whatsapp: '+96890000007'
    },
    {
      title: 'سائق حافلة كبيرة خبرة في النقل السياحي والمؤسسي بصحار',
      description: 'أمتلك رخصة قيادة حافلة وخبرة 12 عاماً في قيادة الحافلات الكبيرة. عملت مع شركات سياحية كبرى ومؤسسات تعليمية. أجيد التعامل مع الركاب والالتزام بخطوط السير والجداول الزمنية. أبحث عن فرصة عمل مستقرة في منطقة الباطنة.',
      jobType: 'OFFERING',
      employmentType: 'FULL_TIME',
      salaryPeriod: 'NEGOTIABLE',
      licenseTypes: ['BUS'],
      experienceYears: 12,
      minAge: 45,
      maxAge: 45,
      languages: ['Arabic'],
      nationality: 'Omani',
      vehicleTypes: ['Coach Bus', 'School Bus'],
      hasOwnVehicle: false,
      governorate: 'OM_BAN',
      city: 'صحار',
      contactPhone: '+96890000008',
      whatsapp: '+96890000008'
    },
    {
      title: 'سائق دراجة نارية لتوصيل الطلبات السريعة في صلالة',
      description: 'أبحث عن عمل كمندوب توصيل طلبات مطاعم أو طرود سريعة في صلالة. أمتلك دراجة نارية حديثة ورخصة قيادة دراجة نارية سارية. نشيط وأمين وسريع في التوصيل. على دراية تامة بجميع مناطق صلالة.',
      jobType: 'OFFERING',
      employmentType: 'PART_TIME',
      salary: 200,
      salaryPeriod: 'MONTHLY',
      licenseTypes: ['MOTORCYCLE'],
      experienceYears: 2,
      minAge: 23,
      maxAge: 23,
      languages: ['Arabic'],
      vehicleTypes: ['Motorcycle'],
      hasOwnVehicle: true,
      governorate: 'OM_DHO',
      city: 'صلالة',
      contactPhone: '+96890000009',
      whatsapp: '+96890000009'
    },
    {
      title: 'سائق معدات ثقيلة رافعة وحفار لمشاريع الإنشاء في الدقم',
      description: 'سائق محترف للمعدات الثقيلة بخبرة 6 سنوات في المواقع الإنشائية والحفريات وتمديدات الخدمات في مشاريع قومية كبرى. دقة في العمل وقدرة على التعامل مع مختلف أنواع المعدات الثقيلة. رخصة سارية. أبحث عن فرصة في منطقة الوسطى.',
      jobType: 'OFFERING',
      employmentType: 'FULL_TIME',
      salary: 550,
      salaryPeriod: 'MONTHLY',
      licenseTypes: ['HEAVY'],
      experienceYears: 6,
      minAge: 35,
      maxAge: 35,
      languages: ['Arabic'],
      vehicleTypes: ['Crane', 'Excavator', 'Forklift'],
      hasOwnVehicle: false,
      governorate: 'OM_WUS',
      city: 'الدقم',
      contactPhone: '+96890000010',
      whatsapp: '+96890000010'
    }
  ];

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    try {
      const jobData = JSON.stringify(job);
      const created = await new Promise((resolve, reject) => {
        const req = https.request('https://caroneapi-production.up.railway.app/api/v1/jobs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(jobData),
            'Authorization': 'Bearer ' + token
          }
        }, res => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 201 || res.statusCode === 200) {
              resolve(JSON.parse(data));
            } else {
              reject(new Error('Failed to create job ' + (i + 1) + ': ' + res.statusCode + ' ' + data));
            }
          });
        });
        req.on('error', reject);
        req.write(jobData);
        req.end();
      });
      console.log('Created job ' + (i + 1) + ': ' + created.title);
    } catch (e) {
      console.error(e.message);
    }
  }

  console.log('Done!');
}

createJobs().catch(console.error);
