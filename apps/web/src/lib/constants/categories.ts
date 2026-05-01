export interface SubCategory {
  value: string;
  label: string;
  route: string;
  available: boolean;
}

export interface MainCategory {
  value: string;
  label: string;
  icon: string;
  color: string;
  subcategories: SubCategory[];
}

type T = (key: string) => string;

export function getMainCategories(t: T): MainCategory[] {
  return [
    {
      value: 'vehicles-parts', label: t('vehiclesParts'), icon: '🚗',
      color: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
      subcategories: [
        { value: 'car-sale', label: t('carSale'), route: '/add-listing/car?type=SALE', available: true },
        { value: 'car-rental', label: t('carRental'), route: '/add-listing/car?type=RENTAL', available: true },
        { value: 'spare-parts', label: t('spareParts'), route: '/add-listing/parts', available: true },
        { value: 'tires-batteries', label: t('tiresBatteries'), route: '/add-listing/parts?cat=TIRES', available: true },
        { value: 'accessories', label: t('accessories'), route: '/add-listing/parts?cat=ACCESSORIES', available: true },
      ],
    },
    {
      value: 'buses', label: t('buses'), icon: '🚌',
      color: 'bg-teal-50 text-teal-600 dark:bg-teal-950 dark:text-teal-400',
      subcategories: [
        { value: 'bus-sale', label: t('busSale'), route: '/add-listing/bus?type=BUS_SALE', available: true },
        { value: 'bus-sale-contract', label: t('busSaleContract'), route: '/add-listing/bus?type=BUS_SALE_WITH_CONTRACT', available: true },
        { value: 'bus-rent', label: t('busRent'), route: '/add-listing/bus?type=BUS_RENT', available: true },
        { value: 'bus-contract', label: t('busContract'), route: '/add-listing/bus?type=BUS_CONTRACT', available: true },
      ],
    },
    {
      value: 'jobs', label: t('jobs'), icon: '💼',
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
      subcategories: [
        { value: 'job-offering', label: t('jobOffering'), route: '/jobs/new?type=OFFERING', available: true },
        { value: 'job-hiring', label: t('jobHiring'), route: '/jobs/new?type=HIRING', available: true },
      ],
    },
    {
      value: 'car-services', label: t('carServices'), icon: '🔧',
      color: 'bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400',
      subcategories: [
        { value: 'maintenance', label: t('maintenance'), route: '/add-listing/service?type=MAINTENANCE', available: true },
        { value: 'cleaning', label: t('cleaning'), route: '/add-listing/service?type=CLEANING', available: true },
        { value: 'inspection', label: t('inspection'), route: '/add-listing/service?type=INSPECTION', available: true },
        { value: 'bodywork', label: t('bodywork'), route: '/add-listing/service?type=BODYWORK', available: true },
        { value: 'towing', label: t('towing'), route: '/add-listing/service?type=TOWING', available: true },
        { value: 'modification', label: t('modification'), route: '/add-listing/service?type=MODIFICATION', available: true },
        { value: 'keys', label: t('keys'), route: '/add-listing/service?type=KEYS_LOCKS', available: true },
        { value: 'accessories-install', label: t('accessoriesInstall'), route: '/add-listing/service?type=ACCESSORIES_INSTALL', available: true },
      ],
    },
    {
      value: 'heavy-equipment', label: t('heavyEquipment'), icon: '🏗️',
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
      subcategories: [
        { value: 'equipment-sale', label: t('equipmentSale'), route: '/add-listing/equipment?type=EQUIPMENT_SALE', available: true },
        { value: 'equipment-rental', label: t('equipmentRental'), route: '/add-listing/equipment?type=EQUIPMENT_RENT', available: true },
        { value: 'equipment-request', label: t('equipmentRequest'), route: '/equipment/requests/new', available: true },
        { value: 'operator-listing', label: t('operatorListing'), route: '/add-listing/operator', available: true },
      ],
    },
  ];
}

