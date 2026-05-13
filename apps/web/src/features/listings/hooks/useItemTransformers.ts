'use client'

import { useMemo } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { getImageUrl } from '@/lib/image-utils'
import { resolveLocationLabel } from '@/lib/location-data'
import { useEnumTranslations, type EnumTranslations } from '@/lib/enum-translations'
import { translateEnum } from '@/lib/translate-enum'

import type { ListingItem } from '@/lib/api/listings'
import type { BusListingItem } from '@/lib/api/buses'
import type { EquipmentListingItem, EquipmentRequestItem, OperatorListingItem } from '@/lib/api/equipment'
import type { SparePartItem } from '@/lib/api/parts'
import type { CarServiceItem } from '@/lib/api/services'
import type { JobItem } from '@/lib/api/jobs'

import type { ListingCategory } from '../types/category.types'
import type { UnifiedListingItem, Badge, DetailItem } from '../types/unified-item.types'

// ─── Translation types ──────────────────────────────────────────────────────

type T = ReturnType<typeof useTranslations<'listings'>>

// ─── Shared helpers (pure — no translations) ─────────────────────────────────

function imgs(images?: { url: string }[] | { url?: string | null; isPrimary?: boolean }[] | null): string[] {
  return (images ?? []).map((i: any) => getImageUrl(i.url) ?? '').filter(Boolean)
}

function toPrice(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null
  const price = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(price) && price > 0 ? price : null
}

function formatMoney(value: number, currency: string | undefined, t: T): string {
  const currencyLabel = !currency || currency === 'OMR' ? t('currencyUnit') : currency
  return `${value.toLocaleString('en-US')} ${currencyLabel}`
}

// ─── Badge helpers ──────────────────────────────────────────────────────────

function getListingTypeBadge(type: string, enums: EnumTranslations): Badge {
  const colorMap: Record<string, Badge['color']> = {
    SALE: 'blue', RENTAL: 'green', WANTED: 'orange',
    BUS_SALE: 'blue', BUS_SALE_WITH_CONTRACT: 'blue', BUS_RENT: 'green', BUS_CONTRACT: 'purple', BUS_REQUEST: 'orange',
    EQUIPMENT_SALE: 'blue', EQUIPMENT_RENT: 'green',
  }
  const map = type.startsWith('BUS_')
    ? enums.busListingType
    : type.startsWith('EQUIPMENT_')
    ? enums.equipmentListingType
    : enums.listingType
  return { label: translateEnum(map, type), color: colorMap[type] ?? 'gray' }
}

function getBusTypeBadge(busType: string, enums: EnumTranslations): Badge {
  return { label: translateEnum(enums.busType, busType), color: 'gray' }
}

function getConditionBadge(condition: string, enums: EnumTranslations): Badge {
  const colorMap: Record<string, Badge['color']> = {
    NEW: 'green', USED: 'blue', LIKE_NEW: 'blue', GOOD: 'blue', FAIR: 'orange', POOR: 'red', REFURBISHED: 'orange',
  }
  return { label: translateEnum(enums.condition, condition), color: colorMap[condition] ?? 'gray' }
}

// ─── Enum translators ───────────────────────────────────────────────────────

function translateTransmission(v: string, enums: EnumTranslations): string { return translateEnum(enums.transmission, v) }
function translateFuel(v: string, enums: EnumTranslations): string { return translateEnum(enums.fuelType, v) }
function translateServiceType(v: string, enums: EnumTranslations): string { return translateEnum(enums.serviceType, v) }
function translateProvider(v: string, enums: EnumTranslations): string { return translateEnum(enums.providerType, v) }
function translatePartCategory(v: string, enums: EnumTranslations): string { return translateEnum(enums.partCategory, v) }
function translateEquipmentType(v: string, enums: EnumTranslations): string { return translateEnum(enums.equipmentType, v) }

// ─── Entity route maps ──────────────────────────────────────────────────────

const ENTITY_CATEGORY: Record<string, ListingCategory | 'jobs'> = {
  LISTING: 'cars', BUS_LISTING: 'buses', EQUIPMENT_LISTING: 'equipment',
  EQUIPMENT_REQUEST: 'equipment-requests', OPERATOR_LISTING: 'operators',
  SPARE_PART: 'parts', CAR_SERVICE: 'services', JOB: 'jobs',
}

const ENTITY_ROUTE: Record<string, string> = {
  LISTING: '/sale/car', BUS_LISTING: '/sale/bus', EQUIPMENT_LISTING: '/sale/equipment',
  EQUIPMENT_REQUEST: '/equipment/requests', OPERATOR_LISTING: '/equipment/operators',
  SPARE_PART: '/sale/part', CAR_SERVICE: '/sale/service', JOB: '/jobs',
}

// ─── Favorite item interface ────────────────────────────────────────────────

interface FavoriteLike {
  id: string
  entityId: string
  entityType: string
  entity?: {
    title?: string | null
    image?: string | null
    governorate?: string | null
    createdAt?: string
  } | null
  listing?: ListingItem | null
  busListing?: BusListingItem | null
  equipmentListing?: EquipmentListingItem | null
  operatorListing?: OperatorListingItem | null
  sparePart?: SparePartItem | null
  carService?: CarServiceItem | null
  job?: JobItem | null
  createdAt?: string
}

// ─── The Hook ───────────────────────────────────────────────────────────────

export function useItemTransformers() {
  const t = useTranslations('listings')
  const tj = useTranslations('jobs')
  const enums = useEnumTranslations()
  const locale = useLocale()

  return useMemo(() => {

    // ── Car ──────────────────────────────────────────────────────────────

    function transformCar(raw: ListingItem): UnifiedListingItem {
      const price = raw.listingType === 'RENTAL'
        ? toPrice(raw.dailyPrice ?? raw.monthlyPrice ?? raw.price)
        : toPrice(raw.price)
      const priceLabel = raw.listingType === 'RENTAL'
        ? raw.dailyPrice ? t('daily') : raw.monthlyPrice ? t('monthly') : null
        : null

      const details: DetailItem[] = [
        raw.year             ? { icon: 'Calendar',  value: String(raw.year) }                              : null,
        raw.transmission     ? { icon: 'Settings2', value: translateTransmission(raw.transmission, enums) } : null,
        raw.exteriorColor    ? { icon: 'Palette',   value: raw.exteriorColor }                             : null,
        raw.fuelType         ? { icon: 'Fuel',      value: translateFuel(raw.fuelType, enums) }             : null,
      ].filter(Boolean) as DetailItem[]

      return {
        id:                  raw.id,
        category:            'cars',
        title:               `${raw.make} ${raw.model} ${raw.year}`,
        price,
        priceLabel,
        currency:            raw.currency || 'OMR',
        images:              imgs(raw.images),
        governorate:         raw.governorate ?? null,
        createdAt:           raw.createdAt,
        viewCount:           raw.viewCount,
        primaryBadge:        raw.listingType ? getListingTypeBadge(raw.listingType, enums) : null,
        secondaryBadge:      raw.condition  ? getConditionBadge(raw.condition, enums)      : null,
        details:             details.slice(0, 5),
        href:                raw.listingType === 'RENTAL' ? `/rental/car/${raw.id}` : `/sale/car/${raw.id}`,
        phoneNumber:         raw.contactPhone ?? raw.seller?.phone ?? null,
        whatsappNumber:      raw.whatsapp ?? raw.contactPhone ?? raw.seller?.phone ?? null,
        isPriceNegotiable:   raw.isPriceNegotiable,
        sellerVerified:      raw.seller?.isVerified ?? false,
        favoriteEntityType:  'LISTING',
        attributes: {
          slug: raw.slug, make: raw.make, model: raw.model, year: raw.year,
          price: raw.price, currency: raw.currency, mileage: raw.mileage,
          fuelType: raw.fuelType, transmission: raw.transmission, condition: raw.condition,
          bodyType: raw.bodyType, exteriorColor: raw.exteriorColor, interior: raw.interior,
          features: raw.features, engineSize: raw.engineSize, horsepower: raw.horsepower,
          doors: raw.doors, seats: raw.seats, driveType: raw.driveType,
          description: raw.description, listingType: raw.listingType,
          dailyPrice: raw.dailyPrice, weeklyPrice: raw.weeklyPrice, monthlyPrice: raw.monthlyPrice,
          minRentalDays: raw.minRentalDays, depositAmount: raw.depositAmount,
          kmLimitPerDay: raw.kmLimitPerDay, withDriver: raw.withDriver,
          deliveryAvailable: raw.deliveryAvailable, insuranceIncluded: raw.insuranceIncluded,
          cancellationPolicy: raw.cancellationPolicy, availableFrom: raw.availableFrom,
          availableTo: raw.availableTo, city: raw.city, latitude: raw.latitude,
          longitude: raw.longitude, isPremium: raw.isPremium, featuredUntil: raw.featuredUntil,
          status: raw.status,
        },
      }
    }

    // ── Bus ──────────────────────────────────────────────────────────────

    function transformBus(raw: BusListingItem): UnifiedListingItem {
      const isRental = raw.busListingType === 'BUS_RENT'
      const isContract = raw.busListingType === 'BUS_CONTRACT'
      const price = isRental
        ? toPrice(raw.dailyPrice ?? raw.monthlyPrice ?? raw.price)
        : toPrice(isContract ? (raw.contractMonthly ?? raw.price) : raw.price)
      const priceLabel = isRental
        ? raw.dailyPrice ? t('daily') : raw.monthlyPrice ? t('monthly') : null
        : isContract && raw.contractMonthly ? t('monthly') : null

      const details: DetailItem[] = [
        raw.year         ? { icon: 'Calendar',  value: String(raw.year) }                                     : null,
        raw.capacity     ? { icon: 'Users',     value: `${raw.capacity} ${t('passenger')}` }                  : null,
        raw.make         ? { icon: 'Bus',       value: raw.make }                                             : null,
        raw.fuelType     ? { icon: 'Fuel',      value: translateFuel(raw.fuelType, enums) }                    : null,
        raw.mileage      ? { icon: 'Gauge',     value: `${raw.mileage.toLocaleString('en-US')} ${t('km')}` }  : null,
      ].filter(Boolean) as DetailItem[]

      return {
        id:                  raw.id,
        category:            'buses',
        title:               raw.title,
        price,
        priceLabel,
        currency:            raw.currency || 'OMR',
        images:              imgs(raw.images),
        governorate:         raw.governorate ?? null,
        createdAt:           raw.createdAt,
        viewCount:           raw.viewCount,
        primaryBadge:        getListingTypeBadge(raw.busListingType, enums),
        secondaryBadge:      raw.busType ? getBusTypeBadge(raw.busType, enums) : null,
        details:             details.slice(0, 5),
        href:                raw.busListingType === 'BUS_RENT' ? `/rental/bus/${raw.id}` : `/sale/bus/${raw.id}`,
        phoneNumber:         raw.contactPhone ?? raw.user?.phone ?? null,
        whatsappNumber:      raw.whatsapp ?? null,
        isPriceNegotiable:   raw.isPriceNegotiable,
        sellerVerified:      raw.user?.isVerified ?? false,
        favoriteEntityType:  'BUS_LISTING',
        attributes: {
          slug: raw.slug, description: raw.description, busListingType: raw.busListingType,
          busType: raw.busType, make: raw.make, model: raw.model, year: raw.year,
          capacity: raw.capacity, mileage: raw.mileage, fuelType: raw.fuelType,
          transmission: raw.transmission, condition: raw.condition, features: raw.features,
          plateNumber: raw.plateNumber, price: raw.price, currency: raw.currency,
          contractType: raw.contractType, contractClient: raw.contractClient,
          contractMonthly: raw.contractMonthly, contractDuration: raw.contractDuration,
          contractExpiry: raw.contractExpiry, dailyPrice: raw.dailyPrice,
          monthlyPrice: raw.monthlyPrice, minRentalDays: raw.minRentalDays,
          withDriver: raw.withDriver, deliveryAvailable: raw.deliveryAvailable,
          depositAmount: raw.depositAmount, kmLimitPerDay: raw.kmLimitPerDay,
          insuranceIncluded: raw.insuranceIncluded, cancellationPolicy: raw.cancellationPolicy,
          availableFrom: raw.availableFrom, availableTo: raw.availableTo,
          requestPassengers: raw.requestPassengers, city: raw.city,
          latitude: raw.latitude, longitude: raw.longitude, status: raw.status,
        },
      }
    }

    // ── Equipment ────────────────────────────────────────────────────────

    function transformEquipment(raw: EquipmentListingItem): UnifiedListingItem {
      const isRental = raw.listingType === 'EQUIPMENT_RENT'
      const price = isRental
        ? toPrice(raw.dailyPrice ?? raw.monthlyPrice ?? raw.price)
        : toPrice(raw.price)
      const priceLabel = isRental
        ? raw.dailyPrice ? t('daily') : raw.monthlyPrice ? t('monthly') : null
        : null

      const details: DetailItem[] = [
        raw.equipmentType ? { icon: 'Wrench',    value: translateEquipmentType(raw.equipmentType, enums) }            : null,
        raw.make          ? { icon: 'Settings2', value: raw.make }                                                    : null,
        raw.year          ? { icon: 'Calendar',  value: String(raw.year) }                                            : null,
        raw.hoursUsed     ? { icon: 'Gauge',     value: `${raw.hoursUsed.toLocaleString('en-US')} ${t('hoursUnit')}` } : null,
        raw.power         ? { icon: 'Fuel',      value: raw.power }                                                   : null,
      ].filter(Boolean) as DetailItem[]

      return {
        id:                  raw.id,
        category:            'equipment',
        title:               raw.title,
        price,
        priceLabel,
        currency:            raw.currency || 'OMR',
        images:              imgs(raw.images),
        governorate:         raw.governorate ?? null,
        createdAt:           raw.createdAt,
        viewCount:           raw.viewCount,
        primaryBadge:        getListingTypeBadge(raw.listingType, enums),
        secondaryBadge:      raw.condition ? getConditionBadge(raw.condition, enums) : null,
        details:             details.slice(0, 5),
        href:                raw.listingType === 'EQUIPMENT_RENT' ? `/rental/equipment/${raw.id}` : `/sale/equipment/${raw.id}`,
        phoneNumber:         raw.contactPhone ?? raw.user?.phone ?? null,
        whatsappNumber:      raw.whatsapp ?? null,
        isPriceNegotiable:   raw.isPriceNegotiable,
        sellerVerified:      raw.user?.isVerified ?? false,
        favoriteEntityType:  'EQUIPMENT_LISTING',
        attributes: {
          slug: raw.slug, description: raw.description, equipmentType: raw.equipmentType,
          listingType: raw.listingType, make: raw.make, model: raw.model, year: raw.year,
          condition: raw.condition, capacity: raw.capacity, power: raw.power,
          weight: raw.weight, hoursUsed: raw.hoursUsed, features: raw.features,
          price: raw.price, dailyPrice: raw.dailyPrice, weeklyPrice: raw.weeklyPrice,
          monthlyPrice: raw.monthlyPrice, currency: raw.currency, withOperator: raw.withOperator,
          deliveryAvailable: raw.deliveryAvailable, minRentalDays: raw.minRentalDays,
          depositAmount: raw.depositAmount, kmLimitPerDay: raw.kmLimitPerDay,
          insuranceIncluded: raw.insuranceIncluded, cancellationPolicy: raw.cancellationPolicy,
          availableFrom: raw.availableFrom, availableTo: raw.availableTo,
          city: raw.city, latitude: raw.latitude, longitude: raw.longitude, status: raw.status,
        },
      }
    }

    // ── Equipment Request ────────────────────────────────────────────────

    function transformEquipmentRequest(raw: EquipmentRequestItem): UnifiedListingItem {
      const budgetMax = toPrice(raw.budgetMax)
      const budgetMin = toPrice(raw.budgetMin)
      const details: DetailItem[] = [
        raw.equipmentType ? { icon: 'Wrench', value: translateEquipmentType(raw.equipmentType, enums) } : null,
        raw.quantity ? { icon: 'Tag', value: `${t('quantity')}: ${raw.quantity}` } : null,
        raw.rentalDuration ? { icon: 'Calendar', value: raw.rentalDuration } : null,
        raw.withOperator ? { icon: 'HardHat', value: t('withOperator') } : null,
        raw.governorate ? { icon: 'MapPin', value: resolveLocationLabel(raw.governorate, locale) ?? raw.governorate } : null,
      ].filter(Boolean) as DetailItem[]

      return {
        id: raw.id, category: 'equipment-requests', title: raw.title,
        price: budgetMax ?? budgetMin, priceLabel: null,
        priceText: budgetMax ? `${t('budget')}: ${formatMoney(budgetMax, raw.currency, t)}` : null,
        currency: raw.currency || 'OMR', images: [],
        governorate: raw.governorate ?? null, createdAt: raw.createdAt, viewCount: raw.viewCount,
        primaryBadge: { label: t('equipmentRequest'), color: 'orange' },
        secondaryBadge: raw.requestStatus ? {
          label: translateEnum(enums.equipmentRequestStatus, raw.requestStatus),
          color: raw.requestStatus === 'OPEN' ? 'green' : raw.requestStatus === 'IN_PROGRESS' ? 'orange' : 'gray',
        } : null,
        details: details.slice(0, 5),
        href: `/equipment/requests/${raw.slug || raw.id}`,
        phoneNumber: raw.contactPhone ?? raw.user?.phone ?? null,
        whatsappNumber: raw.whatsapp ?? null,
        sellerVerified: raw.user?.isVerified ?? false,
        favoriteEntityType: 'EQUIPMENT_REQUEST',
        attributes: {
          slug: raw.slug, description: raw.description, equipmentType: raw.equipmentType,
          quantity: raw.quantity, budgetMin: raw.budgetMin, budgetMax: raw.budgetMax,
          currency: raw.currency, rentalDuration: raw.rentalDuration, startDate: raw.startDate,
          endDate: raw.endDate, withOperator: raw.withOperator, city: raw.city,
          requestStatus: raw.requestStatus, bidsCount: raw._count?.bids,
        },
      }
    }

    // ── Operator ─────────────────────────────────────────────────────────

    function transformOperator(raw: OperatorListingItem): UnifiedListingItem {
      const dailyRate = toPrice(raw.dailyRate)
      const hourlyRate = toPrice(raw.hourlyRate)
      const operatorLabel = translateEnum(enums.operatorType, raw.operatorType)
      const sep = locale === 'en' ? ', ' : '، '
      const details: DetailItem[] = [
        raw.operatorType ? { icon: 'HardHat', value: operatorLabel } : null,
        raw.experienceYears != null ? { icon: 'Calendar', value: t('yearsExperience', { count: raw.experienceYears }) } : null,
        raw.equipmentTypes?.length ? { icon: 'Wrench', value: raw.equipmentTypes.slice(0, 2).map(v => translateEquipmentType(v, enums)).join(sep) } : null,
        raw.specializations?.length ? { icon: 'Tag', value: raw.specializations.slice(0, 2).join(sep) } : null,
        raw.governorate ? { icon: 'MapPin', value: resolveLocationLabel(raw.governorate, locale) ?? raw.governorate } : null,
      ].filter(Boolean) as DetailItem[]

      return {
        id: raw.id, category: 'operators', title: raw.title,
        price: dailyRate ?? hourlyRate,
        priceLabel: dailyRate ? t('daily') : hourlyRate ? t('hourly') : null,
        currency: raw.currency || 'OMR', images: [],
        governorate: raw.governorate ?? null, createdAt: raw.createdAt, viewCount: raw.viewCount,
        primaryBadge: { label: operatorLabel, color: 'purple' },
        secondaryBadge: raw.experienceYears != null ? { label: t('yearsExperience', { count: raw.experienceYears }), color: 'gray' } : null,
        details: details.slice(0, 5),
        href: `/equipment/operators/${raw.slug || raw.id}`,
        phoneNumber: raw.contactPhone ?? raw.user?.phone ?? null,
        whatsappNumber: raw.whatsapp ?? null,
        isPriceNegotiable: raw.isPriceNegotiable,
        sellerVerified: raw.user?.isVerified ?? false,
        favoriteEntityType: 'OPERATOR_LISTING',
        attributes: {
          slug: raw.slug, description: raw.description, operatorType: raw.operatorType,
          specializations: raw.specializations, experienceYears: raw.experienceYears,
          equipmentTypes: raw.equipmentTypes, certifications: raw.certifications,
          dailyRate: raw.dailyRate, hourlyRate: raw.hourlyRate, currency: raw.currency,
          city: raw.city, status: raw.status,
        },
      }
    }

    // ── Part ─────────────────────────────────────────────────────────────

    function transformPart(raw: SparePartItem): UnifiedListingItem {
      const details: DetailItem[] = [
        raw.partCategory            ? { icon: 'Settings',  value: translatePartCategory(raw.partCategory, enums) }      : null,
        raw.compatibleMakes?.length ? { icon: 'Car',       value: raw.compatibleMakes.slice(0, 2).join('، ') }          : null,
        raw.condition               ? { icon: 'Tag',       value: getConditionBadge(raw.condition, enums).label }       : null,
        raw.yearFrom && raw.yearTo
          ? { icon: 'Calendar', value: `${raw.yearFrom}–${raw.yearTo}` }                                       : null,
        raw.governorate             ? { icon: 'MapPin',    value: resolveLocationLabel(raw.governorate, locale) ?? raw.governorate } : null,
      ].filter(Boolean) as DetailItem[]

      return {
        id:                  raw.id,
        category:            'parts',
        title:               raw.title,
        price:               toPrice(raw.price),
        priceLabel:          null,
        currency:            raw.currency || 'OMR',
        images:              imgs(raw.images),
        governorate:         raw.governorate ?? null,
        createdAt:           raw.createdAt,
        viewCount:           raw.viewCount,
        primaryBadge:        raw.condition ? getConditionBadge(raw.condition, enums) : null,
        secondaryBadge:      raw.isOriginal ? { label: t('oem'), color: 'green' } : { label: t('aftermarket'), color: 'orange' },
        details:             details.slice(0, 5),
        href:                `/sale/part/${raw.id}`,
        phoneNumber:         raw.contactPhone ?? raw.seller?.phone ?? null,
        whatsappNumber:      raw.whatsapp ?? null,
        isPriceNegotiable:   raw.isPriceNegotiable,
        sellerVerified:      raw.seller?.isVerified ?? false,
        favoriteEntityType:  'SPARE_PART',
        attributes: {
          slug: raw.slug, description: raw.description, partNumber: raw.partNumber,
          partCategory: raw.partCategory, compatibleMakes: raw.compatibleMakes,
          compatibleModels: raw.compatibleModels, yearFrom: raw.yearFrom, yearTo: raw.yearTo,
          condition: raw.condition, isOriginal: raw.isOriginal, price: raw.price,
          currency: raw.currency, city: raw.city, latitude: raw.latitude,
          longitude: raw.longitude, status: raw.status,
        },
      }
    }

    // ── Job ──────────────────────────────────────────────────────────────

    function transformJob(raw: JobItem): UnifiedListingItem {
      const listSeparator = locale === 'en' ? ', ' : '، '
      const details: DetailItem[] = [
        raw.employmentType ? { icon: 'Tag', value: translateEnum(enums.employmentType, raw.employmentType) } : null,
        raw.experienceYears != null
          ? { icon: 'Calendar', value: tj('yearsExperience', { count: raw.experienceYears }) } : null,
        raw.licenseTypes?.length
          ? { icon: 'Tag', value: raw.licenseTypes.map(v => translateEnum(enums.licenseType, v)).join(listSeparator) } : null,
        raw.vehicleTypes?.length
          ? { icon: 'Car', value: raw.vehicleTypes.map(v => translateEnum(enums.vehicleType, v)).join(listSeparator) } : null,
        raw.hasOwnVehicle
          ? { icon: 'Car', value: tj('hasOwnVehicle') } : null,
      ].filter(Boolean) as DetailItem[]

      const salaryNum = raw.salary ? Number(raw.salary) : null
      const price = salaryNum && salaryNum > 0 ? salaryNum : null
      const isSalaryNegotiable = raw.salaryPeriod === 'NEGOTIABLE'

      return {
        id:                  raw.id,
        category:            'jobs',
        title:               raw.title,
        price,
        priceLabel:          raw.salaryPeriod && !isSalaryNegotiable ? translateEnum(enums.salaryPeriod, raw.salaryPeriod) : null,
        priceText:           isSalaryNegotiable ? translateEnum(enums.salaryPeriod, raw.salaryPeriod) : null,
        currency:            raw.currency || 'OMR',
        images:              [],
        governorate:         raw.governorate ?? null,
        createdAt:           raw.createdAt,
        viewCount:           raw.viewCount,
        primaryBadge:        raw.jobType === 'OFFERING'
          ? { label: translateEnum(enums.jobType, raw.jobType), color: 'blue' }
          : { label: translateEnum(enums.jobType, raw.jobType), color: 'green' },
        secondaryBadge:      raw.employmentType
          ? { label: translateEnum(enums.employmentType, raw.employmentType), color: 'gray' }
          : null,
        details:             details.slice(0, 5),
        href:                `/jobs/${raw.slug || raw.id}`,
        phoneNumber:         raw.contactPhone ?? raw.user?.phone ?? null,
        whatsappNumber:      raw.whatsapp ?? null,
        sellerVerified:      raw.user?.isVerified ?? false,
        favoriteEntityType:  'JOB',
        attributes: {
          slug: raw.slug, description: raw.description, jobType: raw.jobType,
          employmentType: raw.employmentType, salary: raw.salary, salaryPeriod: raw.salaryPeriod,
          currency: raw.currency, licenseTypes: raw.licenseTypes, experienceYears: raw.experienceYears,
          minAge: raw.minAge, maxAge: raw.maxAge, languages: raw.languages,
          nationality: raw.nationality, vehicleTypes: raw.vehicleTypes,
          hasOwnVehicle: raw.hasOwnVehicle, city: raw.city, status: raw.status,
        },
      }
    }

    // ── Service ──────────────────────────────────────────────────────────

    function transformService(raw: CarServiceItem): UnifiedListingItem {
      const details: DetailItem[] = [
        raw.serviceType   ? { icon: 'Wrench',    value: translateServiceType(raw.serviceType, enums) } : null,
        raw.providerType  ? { icon: 'Building2', value: translateProvider(raw.providerType, enums) }   : null,
        raw.isHomeService ? { icon: 'MapPin',    value: t('homeService') }   : null,
        raw.governorate   ? { icon: 'MapPin',    value: resolveLocationLabel(raw.governorate, locale) ?? raw.governorate } : null,
        raw.priceFrom && raw.priceTo
          ? { icon: 'Tag', value: `${Number(raw.priceFrom).toLocaleString('en-US')}–${Number(raw.priceTo).toLocaleString('en-US')}` } : null,
      ].filter(Boolean) as DetailItem[]

      const price = toPrice(raw.priceFrom)
      const currency = raw.currency || 'OMR'

      return {
        id:                  raw.id,
        category:            'services',
        title:               raw.title,
        price,
        priceLabel:          null,
        priceText:           price ? `${t('startingFrom')} ${formatMoney(price, currency, t)}` : null,
        currency,
        images:              imgs(raw.images),
        governorate:         raw.governorate ?? null,
        createdAt:           raw.createdAt,
        viewCount:           raw.viewCount,
        primaryBadge:        raw.serviceType ? { label: translateServiceType(raw.serviceType, enums), color: 'green' } : null,
        secondaryBadge:      raw.isHomeService ? { label: t('homeService'), color: 'green' } : null,
        details:             details.slice(0, 5),
        href:                `/sale/service/${raw.id}`,
        phoneNumber:         raw.contactPhone ?? raw.user?.phone ?? null,
        whatsappNumber:      raw.whatsapp ?? null,
        sellerVerified:      raw.user?.isVerified ?? false,
        favoriteEntityType:  'CAR_SERVICE',
        attributes: {
          slug: raw.slug, description: raw.description, serviceType: raw.serviceType,
          providerType: raw.providerType, isHomeService: raw.isHomeService,
          workingHoursOpen: raw.workingHoursOpen, workingHoursClose: raw.workingHoursClose,
          priceFrom: raw.priceFrom, priceTo: raw.priceTo, currency: raw.currency,
          specializations: raw.specializations, city: raw.city,
          latitude: raw.latitude, longitude: raw.longitude, status: raw.status,
        },
      }
    }

    // ── Favorite (minimal — entity data may be incomplete) ───────────────

    function transformFavorite(fav: FavoriteLike): UnifiedListingItem {
      // Route to the proper transformer if full entity data is available
      if (fav.entityType === 'LISTING' && fav.listing)           return transformCar(fav.listing)
      if (fav.entityType === 'BUS_LISTING' && fav.busListing)    return transformBus(fav.busListing as BusListingItem)
      if (fav.entityType === 'EQUIPMENT_LISTING' && fav.equipmentListing) return transformEquipment(fav.equipmentListing as EquipmentListingItem)
      if (fav.entityType === 'OPERATOR_LISTING' && fav.operatorListing)   return transformOperator(fav.operatorListing as OperatorListingItem)
      if (fav.entityType === 'SPARE_PART' && fav.sparePart)      return transformPart(fav.sparePart as SparePartItem)
      if (fav.entityType === 'CAR_SERVICE' && fav.carService)    return transformService(fav.carService as CarServiceItem)
      if (fav.entityType === 'JOB' && fav.job)                   return transformJob(fav.job as JobItem)

      // Fallback: minimal data (entity may have been deleted or API didn't return full data)
      const category = ENTITY_CATEGORY[fav.entityType] ?? 'cars'
      const route = ENTITY_ROUTE[fav.entityType] || '/'
      const title = fav.entity?.title || t('deletedListing')
      return {
        id: fav.entityId, category, title,
        price: null, priceLabel: null, currency: 'OMR',
        images: fav.entity?.image ? [getImageUrl(fav.entity.image) ?? ''].filter(Boolean) : [],
        governorate: fav.entity?.governorate ?? null,
        createdAt: fav.entity?.createdAt ?? fav.createdAt ?? new Date().toISOString(),
        primaryBadge: null, secondaryBadge: null, details: [],
        href: `${route}/${fav.entityId}`,
        favoriteEntityType: fav.entityType,
        attributes: { favoriteId: fav.id },
      }
    }

    // ── Dispatcher ───────────────────────────────────────────────────────

    function transformByCategory(category: ListingCategory | 'jobs', item: unknown): UnifiedListingItem {
      switch (category) {
        case 'cars':               return transformCar(item as ListingItem)
        case 'buses':              return transformBus(item as BusListingItem)
        case 'equipment':          return transformEquipment(item as EquipmentListingItem)
        case 'equipment-requests': return transformEquipmentRequest(item as EquipmentRequestItem)
        case 'operators':          return transformOperator(item as OperatorListingItem)
        case 'parts':              return transformPart(item as SparePartItem)
        case 'services':           return transformService(item as CarServiceItem)
        case 'jobs':               return transformJob(item as JobItem)
      }
    }

    return {
      transformCar,
      transformBus,
      transformEquipment,
      transformEquipmentRequest,
      transformOperator,
      transformPart,
      transformJob,
      transformService,
      transformFavorite,
      transformByCategory,
    }
  }, [t, tj, enums, locale])
}
