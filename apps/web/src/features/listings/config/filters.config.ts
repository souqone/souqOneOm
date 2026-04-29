import type { ListingCategory } from '../types/category.types'
import type { FilterField, SortOption } from '../types/filters.types'
import { GOVERNORATE_OPTIONS } from './shared'

const GOVERNORATE_FIELD: FilterField = {
  key: 'governorate',
  labelAr: 'المحافظة والولاية',
  type: 'governorate_wilayat',
  primary: true,
  options: GOVERNORATE_OPTIONS,
}

export const FILTERS_CONFIG: Record<ListingCategory, FilterField[]> = {

  cars: [
    {
      key: 'listingType',
      labelAr: 'نوع الإعلان',
      type: 'select',
      primary: true,
      options: [
        { value: 'SALE',   labelAr: 'للبيع' },
        { value: 'RENTAL', labelAr: 'للإيجار' },
        { value: 'WANTED', labelAr: 'مطلوب' },
      ],
    },
    GOVERNORATE_FIELD,
    {
      key: 'make',
      labelAr: 'الماركة',
      type: 'make_model',
      primary: true,
    },
    {
      key: 'yearMin_yearMax',
      labelAr: 'سنة الصنع',
      type: 'range_select',
      primary: true,
      min: 1970,
      max: new Date().getFullYear(),
    },
    {
      key: 'priceMin_priceMax',
      labelAr: 'السعر',
      type: 'range',
      primary: true,
      min: 0,
      max: 100000,
      unit: 'ر.ع',
    },
    {
      key: 'fuelType',
      labelAr: 'نوع الوقود',
      type: 'multiselect',
      primary: false,
      options: [
        { value: 'PETROL',   labelAr: 'بنزين' },
        { value: 'DIESEL',   labelAr: 'ديزل' },
        { value: 'HYBRID',   labelAr: 'هايبرد' },
        { value: 'ELECTRIC', labelAr: 'كهربائي' },
      ],
    },
    {
      key: 'transmission',
      labelAr: 'ناقل الحركة',
      type: 'select',
      primary: false,
      options: [
        { value: 'AUTOMATIC', labelAr: 'أوتوماتيك' },
        { value: 'MANUAL',    labelAr: 'يدوي' },
      ],
    },
    {
      key: 'condition',
      labelAr: 'الحالة',
      type: 'select',
      primary: false,
      options: [
        { value: 'NEW',      labelAr: 'جديد' },
        { value: 'USED',     labelAr: 'مستعمل' },
        { value: 'LIKE_NEW', labelAr: 'شبه جديد' },
      ],
    },
    {
      key: 'bodyType',
      labelAr: 'نوع الهيكل',
      type: 'select',
      primary: false,
      options: [
        { value: 'SEDAN',     labelAr: 'سيدان' },
        { value: 'SUV',       labelAr: 'SUV' },
        { value: 'PICKUP',    labelAr: 'بيك أب' },
        { value: 'HATCHBACK', labelAr: 'هاتشباك' },
        { value: 'COUPE',     labelAr: 'كوبيه' },
        { value: 'VAN',       labelAr: 'فان' },
      ],
    },
    {
      key: 'mileageMax',
      labelAr: 'الكيلومترات (أقل من)',
      type: 'select',
      primary: false,
      options: [
        { value: '30000',  labelAr: 'أقل من 30,000 كم' },
        { value: '60000',  labelAr: 'أقل من 60,000 كم' },
        { value: '100000', labelAr: 'أقل من 100,000 كم' },
        { value: '150000', labelAr: 'أقل من 150,000 كم' },
      ],
    },
  ],

  buses: [
    {
      key: 'busListingType',
      labelAr: 'نوع الإعلان',
      type: 'select',
      primary: true,
      options: [
        { value: 'BUS_SALE',               labelAr: 'للبيع' },
        { value: 'BUS_SALE_WITH_CONTRACT', labelAr: 'بيع مع عقد' },
        { value: 'BUS_RENT',               labelAr: 'للإيجار' },
        { value: 'BUS_CONTRACT',           labelAr: 'تعاقد' },
      ],
    },
    {
      key: 'busType',
      labelAr: 'نوع الحافلة',
      type: 'select',
      primary: true,
      options: [
        { value: 'MINI_BUS',    labelAr: 'ميني باص' },
        { value: 'SCHOOL_BUS',  labelAr: 'حافلة مدرسية' },
        { value: 'CITY_BUS',    labelAr: 'حافلة مدينة' },
        { value: 'COACH',       labelAr: 'كوتش' },
        { value: 'DOUBLE_DECK', labelAr: 'طابقين' },
      ],
    },
    {
      key: 'minPrice_maxPrice',
      labelAr: 'السعر',
      type: 'range',
      primary: true,
      min: 0,
      max: 200000,
      unit: 'ر.ع',
    },
    {
      key: 'make',
      labelAr: 'الماركة',
      type: 'select',
      primary: false,
      options: [
        { value: 'Toyota', labelAr: 'تويوتا' },
        { value: 'Hino',   labelAr: 'هينو' },
        { value: 'Isuzu',  labelAr: 'إيسوزو' },
        { value: 'Yutong', labelAr: 'يوتونج' },
        { value: 'Scania', labelAr: 'سكانيا' },
        { value: 'Volvo',  labelAr: 'فولفو' },
      ],
    },
    {
      key: 'minCapacity_maxCapacity',
      labelAr: 'سعة الركاب',
      type: 'range',
      primary: false,
      min: 10,
      max: 60,
      unit: 'راكب',
    },
    GOVERNORATE_FIELD,
  ],

  equipment: [
    {
      key: 'listingType',
      labelAr: 'نوع الإعلان',
      type: 'select',
      primary: true,
      options: [
        { value: 'EQUIPMENT_SALE', labelAr: 'للبيع' },
        { value: 'EQUIPMENT_RENT', labelAr: 'للإيجار' },
      ],
    },
    {
      key: 'equipmentType',
      labelAr: 'نوع المعدة',
      type: 'select',
      primary: true,
      options: [
        { value: 'EXCAVATOR',       labelAr: 'حفارة' },
        { value: 'CRANE',           labelAr: 'رافعة' },
        { value: 'LOADER',          labelAr: 'لودر' },
        { value: 'BULLDOZER',       labelAr: 'بلدوزر' },
        { value: 'FORKLIFT',        labelAr: 'رافعة شوكية' },
        { value: 'CONCRETE_MIXER',  labelAr: 'خلاطة خرسانة' },
        { value: 'GENERATOR',       labelAr: 'مولد كهربائي' },
        { value: 'COMPRESSOR',      labelAr: 'ضاغط هواء' },
        { value: 'SCAFFOLDING',     labelAr: 'سقالات' },
        { value: 'WELDING_MACHINE', labelAr: 'ماكينة لحام' },
        { value: 'TRUCK',           labelAr: 'شاحنة' },
        { value: 'DUMP_TRUCK',      labelAr: 'شاحنة قلابة' },
        { value: 'WATER_TANKER',    labelAr: 'صهريج مياه' },
        { value: 'LIGHT_EQUIPMENT', labelAr: 'معدات خفيفة' },
        { value: 'OTHER_EQUIPMENT', labelAr: 'أخرى' },
      ],
    },
    {
      key: 'condition',
      labelAr: 'الحالة',
      type: 'select',
      primary: true,
      options: [
        { value: 'NEW',      labelAr: 'جديد' },
        { value: 'LIKE_NEW', labelAr: 'شبه جديد' },
        { value: 'GOOD',     labelAr: 'جيد' },
        { value: 'USED',     labelAr: 'مستعمل' },
        { value: 'FAIR',     labelAr: 'مقبول' },
      ],
    },
    GOVERNORATE_FIELD,
  ],

  'equipment-requests': [
    {
      key: 'equipmentType',
      labelAr: 'نوع المعدة',
      type: 'select',
      primary: true,
      options: [
        { value: 'EXCAVATOR', labelAr: 'حفار' },
        { value: 'CRANE', labelAr: 'رافعة' },
        { value: 'LOADER', labelAr: 'لودر' },
        { value: 'FORKLIFT', labelAr: 'رافعة شوكية' },
        { value: 'OTHER_EQUIPMENT', labelAr: 'أخرى' },
      ],
    },
    {
      key: 'withOperator',
      labelAr: 'مع مشغل',
      type: 'toggle',
      primary: true,
    },
    GOVERNORATE_FIELD,
  ],

  operators: [
    {
      key: 'operatorType',
      labelAr: 'نوع المشغل',
      type: 'select',
      primary: true,
      options: [
        { value: 'DRIVER', labelAr: 'سائق' },
        { value: 'OPERATOR', labelAr: 'مشغل' },
        { value: 'TECHNICIAN', labelAr: 'فني' },
        { value: 'MAINTENANCE', labelAr: 'صيانة' },
      ],
    },
    GOVERNORATE_FIELD,
  ],

  parts: [
    {
      key: 'partCategory',
      labelAr: 'الفئة',
      type: 'select',
      primary: true,
      options: [
        { value: 'ENGINE',       labelAr: 'محرك' },
        { value: 'BODY',         labelAr: 'هيكل' },
        { value: 'ELECTRICAL',   labelAr: 'كهرباء' },
        { value: 'SUSPENSION',   labelAr: 'تعليق' },
        { value: 'BRAKES',       labelAr: 'فرامل' },
        { value: 'TRANSMISSION', labelAr: 'ناقل حركة' },
        { value: 'COOLING',      labelAr: 'تبريد' },
        { value: 'EXHAUST',      labelAr: 'عادم' },
        { value: 'INTERIOR',     labelAr: 'داخلية' },
        { value: 'TIRES',        labelAr: 'إطارات' },
      ],
    },
    {
      key: 'condition',
      labelAr: 'الحالة',
      type: 'select',
      primary: true,
      options: [
        { value: 'NEW',         labelAr: 'جديد' },
        { value: 'USED',        labelAr: 'مستعمل' },
        { value: 'REFURBISHED', labelAr: 'مجدد' },
      ],
    },
    {
      key: 'minPrice_maxPrice',
      labelAr: 'السعر',
      type: 'range',
      primary: true,
      min: 0,
      max: 5000,
      unit: 'ر.ع',
    },
    {
      key: 'make',
      labelAr: 'توافق مع',
      type: 'select',
      primary: false,
      options: [
        { value: 'Toyota',        labelAr: 'تويوتا' },
        { value: 'Nissan',        labelAr: 'نيسان' },
        { value: 'Honda',         labelAr: 'هوندا' },
        { value: 'Hyundai',       labelAr: 'هيونداي' },
        { value: 'Kia',           labelAr: 'كيا' },
        { value: 'Ford',          labelAr: 'فورد' },
        { value: 'BMW',           labelAr: 'بي إم دبليو' },
        { value: 'Mercedes-Benz', labelAr: 'مرسيدس' },
      ],
    },
    GOVERNORATE_FIELD,
  ],

  jobs: [
    {
      key: 'jobType',
      labelAr: 'نوع الإعلان',
      type: 'select',
      primary: true,
      options: [
        { value: 'OFFERING', labelAr: 'باحث عن عمل' },
        { value: 'HIRING',   labelAr: 'مطلوب موظف' },
      ],
    },
    {
      key: 'employmentType',
      labelAr: 'نوع التوظيف',
      type: 'select',
      primary: true,
      options: [
        { value: 'FULL_TIME', labelAr: 'دوام كامل' },
        { value: 'PART_TIME', labelAr: 'دوام جزئي' },
        { value: 'TEMPORARY', labelAr: 'مؤقت' },
        { value: 'CONTRACT',  labelAr: 'عقد' },
      ],
    },
    {
      key: 'licenseType',
      labelAr: 'رخصة القيادة',
      type: 'multiselect',
      primary: false,
      options: [
        { value: 'LIGHT',          labelAr: 'خفيفة' },
        { value: 'HEAVY',          labelAr: 'ثقيلة' },
        { value: 'MOTORCYCLE',     labelAr: 'دراجة نارية' },
        { value: 'BUS',            labelAr: 'حافلات' },
        { value: 'HEAVY_EQUIPMENT', labelAr: 'معدات ثقيلة' },
      ],
    },
    GOVERNORATE_FIELD,
  ],

  services: [
    {
      key: 'serviceType',
      labelAr: 'نوع الخدمة',
      type: 'select',
      primary: true,
      options: [
        { value: 'MAINTENANCE',        labelAr: 'صيانة عامة' },
        { value: 'CLEANING',           labelAr: 'تنظيف وتلميع' },
        { value: 'MODIFICATION',       labelAr: 'تعديل وتيونج' },
        { value: 'INSPECTION',         labelAr: 'فحص شامل' },
        { value: 'BODYWORK',           labelAr: 'سمكرة ودهان' },
        { value: 'ACCESSORIES_INSTALL', labelAr: 'تركيب إكسسوارات' },
        { value: 'KEYS_LOCKS',         labelAr: 'مفاتيح وأقفال' },
        { value: 'TOWING',             labelAr: 'سحب ونقل' },
        { value: 'OTHER_SERVICE',      labelAr: 'خدمات أخرى' },
      ],
    },
    {
      key: 'providerType',
      labelAr: 'نوع المزود',
      type: 'select',
      primary: true,
      options: [
        { value: 'WORKSHOP',   labelAr: 'ورشة' },
        { value: 'INDIVIDUAL', labelAr: 'فرد' },
        { value: 'MOBILE',     labelAr: 'متنقل' },
        { value: 'COMPANY',    labelAr: 'شركة' },
      ],
    },
    {
      key: 'isHomeService',
      labelAr: 'خدمة منزلية',
      type: 'toggle',
      primary: true,
    },
    GOVERNORATE_FIELD,
  ],
}

export const SORT_CONFIG: Record<ListingCategory, SortOption[]> = {
  cars: [
    { value: 'createdAt_desc', labelAr: 'الأحدث' },
    { value: 'price_asc',      labelAr: 'السعر: الأقل' },
    { value: 'price_desc',     labelAr: 'السعر: الأعلى' },
    { value: 'year_desc',      labelAr: 'الأحدث سنة' },
    { value: 'mileage_asc',    labelAr: 'أقل كيلومترات' },
    { value: 'viewCount_desc', labelAr: 'الأكثر مشاهدة' },
  ],
  buses: [
    { value: 'newest',     labelAr: 'الأحدث' },
    { value: 'price_asc',  labelAr: 'السعر: الأقل' },
    { value: 'price_desc', labelAr: 'السعر: الأعلى' },
  ],
  equipment: [{ value: 'createdAt_desc', labelAr: 'الأحدث' }],
  'equipment-requests': [{ value: 'createdAt_desc', labelAr: 'الأحدث' }],
  operators: [{ value: 'createdAt_desc', labelAr: 'الأحدث' }],
  parts: [
    { value: 'createdAt_desc', labelAr: 'الأحدث' },
    { value: 'price_asc',      labelAr: 'السعر: الأقل' },
    { value: 'price_desc',     labelAr: 'السعر: الأعلى' },
  ],
  services:  [{ value: 'createdAt_desc', labelAr: 'الأحدث' }],
  jobs: [
    { value: 'createdAt_desc', labelAr: 'الأحدث' },
    { value: 'salary_desc',    labelAr: 'الراتب: الأعلى' },
    { value: 'salary_asc',     labelAr: 'الراتب: الأقل' },
  ],
}

export const CATEGORY_FILTERS     = FILTERS_CONFIG
export const CATEGORY_SORT_OPTIONS = SORT_CONFIG