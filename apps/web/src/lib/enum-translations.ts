'use client';

import { useTranslations } from 'next-intl';

export function useEnumTranslations() {
  const t = useTranslations('mappings');

  return {
    // ─── Condition ────────────────────────────────────────────
    condition: {
      NEW:         t('conditionNew'),
      USED:        t('conditionUsed'),
      LIKE_NEW:    t('conditionLikeNew'),
      GOOD:        t('conditionGood'),
      FAIR:        t('conditionFair'),
      POOR:        t('conditionPoor'),
      REFURBISHED: t('conditionRefurbished'),
    },

    // ─── Fuel ─────────────────────────────────────────────────
    fuelType: {
      PETROL:   t('fuelPetrol'),
      DIESEL:   t('fuelDiesel'),
      HYBRID:   t('fuelHybrid'),
      ELECTRIC: t('fuelElectric'),
    },

    // ─── Transmission ─────────────────────────────────────────
    transmission: {
      MANUAL:    t('transmissionManual'),
      AUTOMATIC: t('transmissionAutomatic'),
    },

    // ─── Listing Type ─────────────────────────────────────────
    listingType: {
      SALE:    t('typeSale'),
      RENTAL:  t('typeRental'),
      WANTED:  t('typeWanted'),
    },

    // ─── Body Type ────────────────────────────────────────────
    bodyType: {
      SEDAN:       t('bodySedan'),
      SUV:         t('bodySUV'),
      HATCHBACK:   t('bodyHatchback'),
      COUPE:       t('bodyCoupe'),
      PICKUP:      t('bodyPickup'),
      TRUCK:       t('bodyTruck'),
      VAN:         t('bodyVan'),
      CROSSOVER:   t('bodyCrossover'),
      CONVERTIBLE: t('bodyConvertible'),
      WAGON:       t('bodyWagon'),
    },

    // ─── Drive Type ───────────────────────────────────────────
    driveType: {
      FWD:  t('driveFWD'),
      RWD:  t('driveRWD'),
      AWD:  t('driveAWD'),
      '4WD': t('drive4WD'),
    },

    // ─── Part Category ────────────────────────────────────────
    partCategory: {
      ENGINE:        t('enumEngine'),
      BODY:          t('enumBody'),
      ELECTRICAL:    t('enumElectrical'),
      SUSPENSION:    t('enumSuspension'),
      BRAKES:        t('enumBrakes'),
      INTERIOR:      t('enumInterior'),
      TIRES:         t('enumTires'),
      BATTERIES:     t('enumBatteries'),
      OILS:          t('enumOils'),
      ACCESSORIES:   t('enumAccessoriesPart'),
      OTHER:         t('enumOther'),
    },

    // ─── Part Condition ───────────────────────────────────────
    partCondition: {
      NEW:         t('conditionNew'),
      USED:        t('conditionUsed'),
      REFURBISHED: t('conditionRefurbished'),
    },

    // ─── Service Type ─────────────────────────────────────────
    serviceType: {
      MAINTENANCE:           t('enumMaintenance'),
      CLEANING:              t('enumCleaning'),
      MODIFICATION:          t('enumModification'),
      INSPECTION:            t('enumInspection'),
      BODYWORK:              t('enumBodywork'),
      ACCESSORIES_INSTALL:   t('enumAccessoriesInstall'),
      KEYS_LOCKS:            t('enumKeysLocks'),
      TOWING:                t('enumTowing'),
      OTHER_SERVICE:         t('enumOtherService'),
    },

    // ─── Provider Type ────────────────────────────────────────
    providerType: {
      WORKSHOP:   t('enumWorkshop'),
      INDIVIDUAL: t('enumIndividual'),
      MOBILE:     t('enumMobile'),
      COMPANY:    t('enumCompany'),
    },

    // ─── Bus Type ─────────────────────────────────────────────
    busType: {
      MINI_BUS:   t('enumMiniBus'),
      MEDIUM_BUS: t('enumMediumBus'),
      LARGE_BUS:  t('enumLargeBus'),
      COASTER:    t('enumCoaster'),
      SCHOOL_BUS: t('enumSchoolBus'),
    },

    // ─── Bus Listing Type ─────────────────────────────────────
    busListingType: {
      BUS_SALE:              t('enumBusSale'),
      BUS_SALE_WITH_CONTRACT: t('enumBusSaleContract'),
      BUS_RENT:              t('enumBusRent'),
      BUS_CONTRACT:          t('enumBusContract'),
      BUS_REQUEST:           t('enumBusRequest'),
    },

    // ─── Contract Type ────────────────────────────────────────
    contractType: {
      SCHOOL:         t('enumContractSchool'),
      COMPANY:        t('enumContractCompany'),
      GOVERNMENT:     t('enumContractGov'),
      TOURISM:        t('enumContractTourism'),
      OTHER_CONTRACT: t('enumContractOther'),
    },

    // ─── Equipment Type ───────────────────────────────────────
    equipmentType: {
      EXCAVATOR:       t('enumExcavator'),
      CRANE:           t('enumCrane'),
      LOADER:          t('enumLoader'),
      BULLDOZER:       t('enumBulldozer'),
      FORKLIFT:        t('enumForklift'),
      CONCRETE_MIXER:  t('enumConcreteMixer'),
      GENERATOR:       t('enumGenerator'),
      COMPRESSOR:      t('enumCompressor'),
      SCAFFOLDING:     t('enumScaffolding'),
      WELDING_MACHINE: t('enumWeldingMachine'),
      TRUCK:           t('enumTruck'),
      DUMP_TRUCK:      t('enumDumpTruck'),
      WATER_TANKER:    t('enumWaterTanker'),
      LIGHT_EQUIPMENT: t('enumLightEquip'),
      OTHER_EQUIPMENT: t('enumOtherEquip'),
    },

    // ─── Equipment Listing Type ───────────────────────────────
    equipmentListingType: {
      EQUIPMENT_SALE: t('enumEquipSale'),
      EQUIPMENT_RENT: t('enumEquipRent'),
    },

    // ─── Operator Type ────────────────────────────────────────
    operatorType: {
      DRIVER:      t('enumDriver'),
      OPERATOR:    t('enumOperator'),
      TECHNICIAN:  t('enumTechnician'),
      MAINTENANCE: t('enumOperatorMaintenance'),
    },

    // ─── Job Type ─────────────────────────────────────────────
    jobType: {
      OFFERING: t('enumOffering'),
      HIRING:   t('enumHiring'),
    },

    // ─── Employment Type ──────────────────────────────────────
    employmentType: {
      FULL_TIME:  t('enumFullTime'),
      PART_TIME:  t('enumPartTime'),
      TEMPORARY:  t('enumTemporary'),
      CONTRACT:   t('enumContractJob'),
    },

    // ─── License Type ─────────────────────────────────────────
    licenseType: {
      LIGHT:      t('enumLicenseLight'),
      HEAVY:      t('enumLicenseHeavy'),
      TRANSPORT:  t('enumLicenseTransport'),
      BUS:        t('enumLicenseBus'),
      MOTORCYCLE: t('enumLicenseMotorcycle'),
    },

    vehicleType: {
      SEDAN:       t('enumVehicleSedan'),
      SUV:         t('enumVehicleSUV'),
      LIGHT_TRUCK: t('enumVehicleLightTruck'),
      HEAVY_TRUCK: t('enumVehicleHeavyTruck'),
      BUS:         t('enumVehicleBus'),
      LIMO:        t('enumVehicleLimo'),
      VAN:         t('enumVehicleVan'),
      PICKUP:      t('enumVehiclePickup'),
    },

    // ─── Salary Period ────────────────────────────────────────
    salaryPeriod: {
      DAILY:      t('enumSalDaily'),
      MONTHLY:    t('enumSalMonthly'),
      YEARLY:     t('enumSalYearly'),
      NEGOTIABLE: t('enumSalNegotiable'),
    },

    // ─── Cancellation Policy ──────────────────────────────────
    cancellationPolicy: {
      FREE:     t('cancelFree'),
      FLEXIBLE: t('cancelFlexible'),
      MODERATE: t('cancelModerate'),
      STRICT:   t('cancelStrict'),
    },
  };
}

export type EnumTranslations = ReturnType<typeof useEnumTranslations>;
