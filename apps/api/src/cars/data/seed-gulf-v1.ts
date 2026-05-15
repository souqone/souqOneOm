// داتا السيارات — سوق الخليج العربي وسلطنة عُمان
// Gulf & Oman Car Market — Brand → Model → Trim → YearFrom/YearTo

export type TrimDef  = { name: string; nameAr?: string; from: number; to?: number };
export type ModelDef = { name: string; nameAr: string; trims: TrimDef[] };
export type BrandDef = { name: string; nameAr: string; slug: string; isPopular: boolean; models: ModelDef[] };

const TO = 2026;

export const GULF_BRANDS: BrandDef[] = [

  // ─── تويوتا ───────────────────────────────────────────────────────
  {
    name: 'Toyota', nameAr: 'تويوتا', slug: 'toyota', isPopular: true,
    models: [
      { name: 'Land Cruiser 300', nameAr: 'لاند كروزر 300', trims: [
        { name: 'GX',  nameAr: 'GX',  from: 2022, to: TO },
        { name: 'GXR', nameAr: 'GXR', from: 2022, to: TO },
        { name: 'VXR', nameAr: 'VXR', from: 2022, to: TO },
        { name: 'ZX',  nameAr: 'ZX',  from: 2022, to: TO },
      ]},
      { name: 'Land Cruiser', nameAr: 'لاند كروزر', trims: [
        { name: 'GX',       nameAr: 'GX',       from: 2008, to: 2021 },
        { name: 'GX-R V6',  nameAr: 'GX-R V6',  from: 2008, to: 2021 },
        { name: 'GX-R V8',  nameAr: 'GX-R V8',  from: 2008, to: 2021 },
        { name: 'VX-R V8',  nameAr: 'VX-R V8',  from: 2008, to: 2021 },
        { name: 'Sahara',   nameAr: 'سهارا',     from: 2008, to: 2021 },
        { name: 'Titanium', nameAr: 'تيتانيوم',  from: 2016, to: 2021 },
      ]},
      { name: 'Land Cruiser Prado', nameAr: 'لاند كروزر برادو', trims: [
        { name: 'GX',  nameAr: 'GX',  from: 2010, to: TO },
        { name: 'GXR', nameAr: 'GXR', from: 2010, to: TO },
        { name: 'TXL', nameAr: 'TXL', from: 2010, to: TO },
        { name: 'VXL', nameAr: 'VXL', from: 2010, to: TO },
      ]},
      { name: 'Fortuner', nameAr: 'فورتشنر', trims: [
        { name: 'EX',   nameAr: 'EX',   from: 2016, to: TO },
        { name: 'GX',   nameAr: 'GX',   from: 2016, to: TO },
        { name: 'VX',   nameAr: 'VX',   from: 2016, to: TO },
        { name: 'SR5',  nameAr: 'SR5',  from: 2016, to: TO },
        { name: 'GR-S', nameAr: 'GR-S', from: 2021, to: TO },
      ]},
      { name: 'Hilux', nameAr: 'هايلوكس', trims: [
        { name: 'Standard', nameAr: 'ستاندرد', from: 2012, to: TO },
        { name: 'SR',       nameAr: 'SR',       from: 2012, to: TO },
        { name: 'SR5',      nameAr: 'SR5',      from: 2012, to: TO },
        { name: 'GR-S',     nameAr: 'GR-S',     from: 2021, to: TO },
      ]},
      { name: 'Camry', nameAr: 'كامري', trims: [
        { name: 'XLI',    nameAr: 'XLI',    from: 2012, to: TO },
        { name: 'GLI',    nameAr: 'GLI',    from: 2012, to: TO },
        { name: 'SE',     nameAr: 'SE',     from: 2018, to: TO },
        { name: 'XSE',    nameAr: 'XSE',    from: 2018, to: TO },
        { name: 'Hybrid', nameAr: 'هايبرد', from: 2018, to: TO },
      ]},
      { name: 'Corolla', nameAr: 'كورولا', trims: [
        { name: 'XLI',   nameAr: 'XLI',   from: 2014, to: TO },
        { name: 'GLI',   nameAr: 'GLI',   from: 2014, to: TO },
        { name: 'SE',    nameAr: 'SE',    from: 2019, to: TO },
        { name: 'XSE',   nameAr: 'XSE',   from: 2019, to: TO },
        { name: 'Sport', nameAr: 'سبورت', from: 2019, to: TO },
      ]},
      { name: 'RAV4', nameAr: 'راف 4', trims: [
        { name: 'LE',        nameAr: 'LE',              from: 2019, to: TO },
        { name: 'XLE',       nameAr: 'XLE',             from: 2019, to: TO },
        { name: 'Adventure', nameAr: 'أدفينتشر',       from: 2019, to: TO },
        { name: 'XSE Hybrid',nameAr: 'XSE هايبرد',    from: 2021, to: TO },
      ]},
      { name: 'Yaris', nameAr: 'يارس', trims: [
        { name: 'E',   nameAr: 'E',   from: 2014, to: TO },
        { name: 'XLI', nameAr: 'XLI', from: 2020, to: TO },
        { name: 'SE',  nameAr: 'SE',  from: 2020, to: TO },
      ]},
      { name: 'FJ Cruiser', nameAr: 'FJ كروزر', trims: [
        { name: 'Base',       nameAr: 'بيس',           from: 2007, to: 2022 },
        { name: 'Trail Teams',nameAr: 'تريل تيمز',    from: 2012, to: 2022 },
      ]},
      { name: 'Hiace', nameAr: 'هايس', trims: [
        { name: 'GL',  nameAr: 'GL',  from: 2005, to: TO },
        { name: 'GLS', nameAr: 'GLS', from: 2019, to: TO },
      ]},
      { name: 'Rush', nameAr: 'راش', trims: [
        { name: 'G', nameAr: 'G', from: 2018, to: TO },
        { name: 'S', nameAr: 'S', from: 2018, to: TO },
      ]},
      { name: 'Innova', nameAr: 'إينوفا', trims: [
        { name: 'G', nameAr: 'G', from: 2016, to: 2024 },
        { name: 'V', nameAr: 'V', from: 2016, to: 2024 },
      ]},
      { name: 'Avanza', nameAr: 'أفانزا', trims: [
        { name: 'E', nameAr: 'E', from: 2012, to: 2022 },
        { name: 'G', nameAr: 'G', from: 2012, to: 2022 },
      ]},
    ],
  },

  // ─── نيسان ────────────────────────────────────────────────────────
  {
    name: 'Nissan', nameAr: 'نيسان', slug: 'nissan', isPopular: true,
    models: [
      { name: 'Patrol', nameAr: 'باترول', trims: [
        { name: 'XE',       nameAr: 'XE',       from: 2010, to: TO },
        { name: 'SE',       nameAr: 'SE',       from: 2010, to: TO },
        { name: 'LE',       nameAr: 'LE',       from: 2010, to: TO },
        { name: 'Platinum', nameAr: 'بلاتينيوم', from: 2016, to: TO },
        { name: 'Nismo',    nameAr: 'نيسمو',    from: 2016, to: TO },
      ]},
      { name: 'Pathfinder', nameAr: 'باثفايندر', trims: [
        { name: 'S',        nameAr: 'S',        from: 2013, to: TO },
        { name: 'SV',       nameAr: 'SV',       from: 2013, to: TO },
        { name: 'SL',       nameAr: 'SL',       from: 2013, to: TO },
        { name: 'Platinum', nameAr: 'بلاتينيوم', from: 2013, to: TO },
      ]},
      { name: 'Altima', nameAr: 'ألتيما', trims: [
        { name: 'S',  nameAr: 'S',  from: 2019, to: TO },
        { name: 'SV', nameAr: 'SV', from: 2019, to: TO },
        { name: 'SR', nameAr: 'SR', from: 2019, to: TO },
        { name: 'SL', nameAr: 'SL', from: 2019, to: TO },
      ]},
      { name: 'Sunny', nameAr: 'صني', trims: [
        { name: 'S',  nameAr: 'S',  from: 2012, to: TO },
        { name: 'SV', nameAr: 'SV', from: 2020, to: TO },
      ]},
      { name: 'X-Trail', nameAr: 'إكس تريل', trims: [
        { name: 'S',  nameAr: 'S',  from: 2015, to: TO },
        { name: 'SV', nameAr: 'SV', from: 2015, to: TO },
        { name: 'SL', nameAr: 'SL', from: 2021, to: TO },
      ]},
      { name: 'Navara', nameAr: 'نافارا', trims: [
        { name: 'S',   nameAr: 'S',   from: 2015, to: TO },
        { name: 'SV',  nameAr: 'SV',  from: 2015, to: TO },
        { name: 'LE',  nameAr: 'LE',  from: 2015, to: TO },
      ]},
      { name: 'Kicks', nameAr: 'كيكس', trims: [
        { name: 'S',  nameAr: 'S',  from: 2018, to: TO },
        { name: 'SV', nameAr: 'SV', from: 2018, to: TO },
        { name: 'SR', nameAr: 'SR', from: 2021, to: TO },
      ]},
      { name: 'Armada', nameAr: 'أرمادا', trims: [
        { name: 'SV',       nameAr: 'SV',       from: 2017, to: TO },
        { name: 'SL',       nameAr: 'SL',       from: 2017, to: TO },
        { name: 'Platinum', nameAr: 'بلاتينيوم', from: 2017, to: TO },
      ]},
      { name: 'Murano', nameAr: 'مورانو', trims: [
        { name: 'S',        nameAr: 'S',        from: 2015, to: TO },
        { name: 'SV',       nameAr: 'SV',       from: 2015, to: TO },
        { name: 'SL',       nameAr: 'SL',       from: 2015, to: TO },
        { name: 'Platinum', nameAr: 'بلاتينيوم', from: 2015, to: TO },
      ]},
      { name: 'Maxima', nameAr: 'ماكسيما', trims: [
        { name: 'S',  nameAr: 'S',  from: 2016, to: 2023 },
        { name: 'SV', nameAr: 'SV', from: 2016, to: 2023 },
        { name: 'SL', nameAr: 'SL', from: 2016, to: 2023 },
      ]},
      { name: 'Urvan', nameAr: 'أورفان', trims: [
        { name: 'GL',  nameAr: 'GL',  from: 2012, to: TO },
        { name: 'GLS', nameAr: 'GLS', from: 2012, to: TO },
      ]},
    ],
  },

  // ─── هيونداي ──────────────────────────────────────────────────────
  {
    name: 'Hyundai', nameAr: 'هيونداي', slug: 'hyundai', isPopular: true,
    models: [
      { name: 'Sonata', nameAr: 'سوناتا', trims: [
        { name: 'S',   nameAr: 'S',   from: 2020, to: TO },
        { name: 'SE',  nameAr: 'SE',  from: 2020, to: TO },
        { name: 'GLS', nameAr: 'GLS', from: 2020, to: TO },
      ]},
      { name: 'Elantra', nameAr: 'إيلانترا', trims: [
        { name: 'S',     nameAr: 'S',     from: 2017, to: TO },
        { name: 'SE',    nameAr: 'SE',    from: 2017, to: TO },
        { name: 'GLS',   nameAr: 'GLS',   from: 2017, to: TO },
        { name: 'Sport', nameAr: 'سبورت', from: 2021, to: TO },
        { name: 'N Line', nameAr: 'N لاين', from: 2021, to: TO },
      ]},
      { name: 'Tucson', nameAr: 'توسان', trims: [
        { name: 'S',   nameAr: 'S',   from: 2016, to: TO },
        { name: 'SE',  nameAr: 'SE',  from: 2016, to: TO },
        { name: 'GLS', nameAr: 'GLS', from: 2016, to: TO },
      ]},
      { name: 'Santa Fe', nameAr: 'سانتا في', trims: [
        { name: 'S',   nameAr: 'S',   from: 2019, to: TO },
        { name: 'SE',  nameAr: 'SE',  from: 2019, to: TO },
        { name: 'GLS', nameAr: 'GLS', from: 2019, to: TO },
      ]},
      { name: 'Accent', nameAr: 'أكسنت', trims: [
        { name: 'S',  nameAr: 'S',  from: 2012, to: TO },
        { name: 'SE', nameAr: 'SE', from: 2018, to: TO },
      ]},
      { name: 'Creta', nameAr: 'كريتا', trims: [
        { name: 'S',   nameAr: 'S',   from: 2022, to: TO },
        { name: 'SE',  nameAr: 'SE',  from: 2022, to: TO },
        { name: 'SE+', nameAr: 'SE+', from: 2022, to: TO },
      ]},
      { name: 'Palisade', nameAr: 'باليسيد', trims: [
        { name: 'SE',  nameAr: 'SE',  from: 2020, to: TO },
        { name: 'GLS', nameAr: 'GLS', from: 2020, to: TO },
      ]},
      { name: 'Staria', nameAr: 'ستاريا', trims: [
        { name: 'SE',  nameAr: 'SE',  from: 2021, to: TO },
        { name: 'GLS', nameAr: 'GLS', from: 2021, to: TO },
      ]},
      { name: 'Ioniq 5', nameAr: 'أيونيك 5', trims: [
        { name: 'Standard Range', nameAr: 'ستاندرد رينج', from: 2022, to: TO },
        { name: 'Long Range',     nameAr: 'لونج رينج',    from: 2022, to: TO },
        { name: 'N Line',         nameAr: 'N لاين',       from: 2023, to: TO },
      ]},
      { name: 'H1', nameAr: 'H1', trims: [
        { name: 'GLS', nameAr: 'GLS', from: 2008, to: 2021 },
      ]},
    ],
  },

  // ─── كيا ──────────────────────────────────────────────────────────
  {
    name: 'Kia', nameAr: 'كيا', slug: 'kia', isPopular: true,
    models: [
      { name: 'Sportage', nameAr: 'سبورتاج', trims: [
        { name: 'LX',      nameAr: 'LX',      from: 2017, to: TO },
        { name: 'EX',      nameAr: 'EX',      from: 2017, to: TO },
        { name: 'GT-Line', nameAr: 'GT لاين', from: 2022, to: TO },
        { name: 'SX',      nameAr: 'SX',      from: 2022, to: TO },
      ]},
      { name: 'Sorento', nameAr: 'سورنتو', trims: [
        { name: 'LX', nameAr: 'LX', from: 2016, to: TO },
        { name: 'EX', nameAr: 'EX', from: 2016, to: TO },
        { name: 'SX', nameAr: 'SX', from: 2021, to: TO },
      ]},
      { name: 'Cerato', nameAr: 'سيراتو', trims: [
        { name: 'LX',      nameAr: 'LX',      from: 2014, to: TO },
        { name: 'EX',      nameAr: 'EX',      from: 2014, to: TO },
        { name: 'GT-Line', nameAr: 'GT لاين', from: 2019, to: TO },
      ]},
      { name: 'Picanto', nameAr: 'بيكانتو', trims: [
        { name: 'LX', nameAr: 'LX', from: 2012, to: TO },
        { name: 'EX', nameAr: 'EX', from: 2017, to: TO },
      ]},
      { name: 'Seltos', nameAr: 'سيلتوس', trims: [
        { name: 'LX',      nameAr: 'LX',      from: 2020, to: TO },
        { name: 'EX',      nameAr: 'EX',      from: 2020, to: TO },
        { name: 'GT-Line', nameAr: 'GT لاين', from: 2020, to: TO },
      ]},
      { name: 'Carnival', nameAr: 'كارنفال', trims: [
        { name: 'LX', nameAr: 'LX', from: 2021, to: TO },
        { name: 'EX', nameAr: 'EX', from: 2021, to: TO },
        { name: 'SX', nameAr: 'SX', from: 2021, to: TO },
      ]},
      { name: 'Telluride', nameAr: 'تيلورايد', trims: [
        { name: 'LX', nameAr: 'LX', from: 2020, to: TO },
        { name: 'EX', nameAr: 'EX', from: 2020, to: TO },
        { name: 'SX', nameAr: 'SX', from: 2020, to: TO },
        { name: 'X-Line', nameAr: 'X لاين', from: 2022, to: TO },
      ]},
      { name: 'EV6', nameAr: 'EV6', trims: [
        { name: 'Standard Range', nameAr: 'ستاندرد رينج', from: 2022, to: TO },
        { name: 'Long Range',     nameAr: 'لونج رينج',    from: 2022, to: TO },
        { name: 'GT',             nameAr: 'GT',            from: 2023, to: TO },
      ]},
    ],
  },

  // ─── ميتسوبيشي ────────────────────────────────────────────────────
  {
    name: 'Mitsubishi', nameAr: 'ميتسوبيشي', slug: 'mitsubishi', isPopular: true,
    models: [
      { name: 'Pajero', nameAr: 'باجيرو', trims: [
        { name: 'GLX', nameAr: 'GLX', from: 2007, to: TO },
        { name: 'GLS', nameAr: 'GLS', from: 2007, to: TO },
        { name: 'GLS Sport', nameAr: 'GLS سبورت', from: 2007, to: TO },
      ]},
      { name: 'Pajero Sport', nameAr: 'باجيرو سبورت', trims: [
        { name: 'GLX', nameAr: 'GLX', from: 2016, to: TO },
        { name: 'GLS', nameAr: 'GLS', from: 2016, to: TO },
        { name: 'GT',  nameAr: 'GT',  from: 2016, to: TO },
      ]},
      { name: 'Outlander', nameAr: 'أوتلاندر', trims: [
        { name: 'ES', nameAr: 'ES', from: 2014, to: TO },
        { name: 'LE', nameAr: 'LE', from: 2014, to: TO },
        { name: 'SE', nameAr: 'SE', from: 2022, to: TO },
      ]},
      { name: 'L200', nameAr: 'L200', trims: [
        { name: 'GL',  nameAr: 'GL',  from: 2010, to: TO },
        { name: 'GLX', nameAr: 'GLX', from: 2010, to: TO },
        { name: 'GLS', nameAr: 'GLS', from: 2019, to: TO },
      ]},
      { name: 'Eclipse Cross', nameAr: 'إكليبس كروس', trims: [
        { name: 'ES',      nameAr: 'ES',      from: 2018, to: TO },
        { name: 'LE',      nameAr: 'LE',      from: 2018, to: TO },
        { name: 'GT',      nameAr: 'GT',      from: 2018, to: TO },
        { name: 'Touring', nameAr: 'تورينج',  from: 2022, to: TO },
      ]},
      { name: 'Xpander', nameAr: 'إكسباندر', trims: [
        { name: 'GL',  nameAr: 'GL',  from: 2021, to: TO },
        { name: 'GLS', nameAr: 'GLS', from: 2021, to: TO },
      ]},
    ],
  },

  // ─── هوندا ────────────────────────────────────────────────────────
  {
    name: 'Honda', nameAr: 'هوندا', slug: 'honda', isPopular: true,
    models: [
      { name: 'Accord', nameAr: 'أكورد', trims: [
        { name: 'LX',    nameAr: 'LX',    from: 2014, to: TO },
        { name: 'Sport', nameAr: 'سبورت', from: 2018, to: TO },
        { name: 'EX-L',  nameAr: 'EX-L',  from: 2018, to: TO },
        { name: 'Touring',nameAr: 'تورينج',from: 2018, to: TO },
      ]},
      { name: 'Civic', nameAr: 'سيفيك', trims: [
        { name: 'LX',    nameAr: 'LX',    from: 2016, to: TO },
        { name: 'Sport', nameAr: 'سبورت', from: 2016, to: TO },
        { name: 'EX',    nameAr: 'EX',    from: 2016, to: TO },
        { name: 'RS',    nameAr: 'RS',    from: 2022, to: TO },
        { name: 'Type R', nameAr: 'تايب R', from: 2023, to: TO },
      ]},
      { name: 'CR-V', nameAr: 'CR-V', trims: [
        { name: 'LX',      nameAr: 'LX',      from: 2012, to: TO },
        { name: 'EX-L',    nameAr: 'EX-L',    from: 2012, to: TO },
        { name: 'Touring', nameAr: 'تورينج',  from: 2017, to: TO },
      ]},
      { name: 'Pilot', nameAr: 'بايلوت', trims: [
        { name: 'LX',      nameAr: 'LX',      from: 2016, to: TO },
        { name: 'EX-L',    nameAr: 'EX-L',    from: 2016, to: TO },
        { name: 'Touring', nameAr: 'تورينج',  from: 2016, to: TO },
      ]},
      { name: 'HR-V', nameAr: 'HR-V', trims: [
        { name: 'LX', nameAr: 'LX', from: 2016, to: TO },
        { name: 'EX', nameAr: 'EX', from: 2016, to: TO },
        { name: 'Sport', nameAr: 'سبورت', from: 2023, to: TO },
      ]},
      { name: 'City', nameAr: 'سيتي', trims: [
        { name: 'S',      nameAr: 'S',      from: 2009, to: TO },
        { name: 'E',      nameAr: 'E',      from: 2009, to: TO },
        { name: 'V',      nameAr: 'V',      from: 2009, to: TO },
        { name: 'RS',     nameAr: 'RS',     from: 2021, to: TO },
      ]},
      { name: 'Odyssey', nameAr: 'أوديسي', trims: [
        { name: 'LX',      nameAr: 'LX',     from: 2014, to: TO },
        { name: 'EX-L',    nameAr: 'EX-L',   from: 2014, to: TO },
        { name: 'Touring', nameAr: 'تورينج', from: 2018, to: TO },
      ]},
    ],
  },

  // ─── فورد ─────────────────────────────────────────────────────────
  {
    name: 'Ford', nameAr: 'فورد', slug: 'ford', isPopular: true,
    models: [
      { name: 'F-150', nameAr: 'F-150', trims: [
        { name: 'XL',         nameAr: 'XL',         from: 2015, to: TO },
        { name: 'XLT',        nameAr: 'XLT',        from: 2015, to: TO },
        { name: 'Lariat',     nameAr: 'لاريات',     from: 2015, to: TO },
        { name: 'King Ranch', nameAr: 'كينج رانش',  from: 2015, to: TO },
        { name: 'Platinum',   nameAr: 'بلاتينيوم',  from: 2015, to: TO },
        { name: 'Raptor',     nameAr: 'رابتور',     from: 2017, to: TO },
      ]},
      { name: 'Ranger', nameAr: 'رينجر', trims: [
        { name: 'XL',       nameAr: 'XL',      from: 2012, to: TO },
        { name: 'XLT',      nameAr: 'XLT',     from: 2012, to: TO },
        { name: 'Wildtrak', nameAr: 'وايلدتراك', from: 2012, to: TO },
        { name: 'Raptor',   nameAr: 'رابتور',  from: 2019, to: TO },
      ]},
      { name: 'Explorer', nameAr: 'إكسبلورر', trims: [
        { name: 'XLT',     nameAr: 'XLT',     from: 2011, to: TO },
        { name: 'Limited', nameAr: 'ليمتد',   from: 2011, to: TO },
        { name: 'Platinum',nameAr: 'بلاتينيوم', from: 2011, to: TO },
        { name: 'ST',      nameAr: 'ST',       from: 2020, to: TO },
      ]},
      { name: 'Expedition', nameAr: 'إكسبيديشن', trims: [
        { name: 'XLT',     nameAr: 'XLT',     from: 2011, to: TO },
        { name: 'Limited', nameAr: 'ليمتد',   from: 2011, to: TO },
        { name: 'King Ranch', nameAr: 'كينج رانش', from: 2011, to: TO },
        { name: 'Platinum', nameAr: 'بلاتينيوم', from: 2018, to: TO },
      ]},
      { name: 'Mustang', nameAr: 'موستانج', trims: [
        { name: 'EcoBoost',  nameAr: 'إيكوبوست', from: 2015, to: TO },
        { name: 'GT',        nameAr: 'GT',        from: 2015, to: TO },
        { name: 'Mach 1',    nameAr: 'ماك 1',     from: 2021, to: TO },
        { name: 'Shelby GT500', nameAr: 'شيلبي GT500', from: 2020, to: TO },
      ]},
      { name: 'Bronco', nameAr: 'برونكو', trims: [
        { name: 'Base',      nameAr: 'بيس',       from: 2021, to: TO },
        { name: 'Big Bend',  nameAr: 'بيج بيند',  from: 2021, to: TO },
        { name: 'Wildtrak',  nameAr: 'وايلدتراك', from: 2021, to: TO },
        { name: 'Badlands',  nameAr: 'بادلاندز',  from: 2021, to: TO },
        { name: 'Raptor',    nameAr: 'رابتور',    from: 2022, to: TO },
      ]},
      { name: 'Everest', nameAr: 'إيفرست', trims: [
        { name: 'Trend',    nameAr: 'تريند',    from: 2023, to: TO },
        { name: 'Sport',    nameAr: 'سبورت',    from: 2023, to: TO },
        { name: 'Titanium', nameAr: 'تيتانيوم', from: 2023, to: TO },
        { name: 'Platinum', nameAr: 'بلاتينيوم', from: 2023, to: TO },
      ]},
    ],
  },

  // ─── شيفروليه ─────────────────────────────────────────────────────
  {
    name: 'Chevrolet', nameAr: 'شيفروليه', slug: 'chevrolet', isPopular: true,
    models: [
      { name: 'Tahoe', nameAr: 'تاهو', trims: [
        { name: 'LS',           nameAr: 'LS',            from: 2007, to: TO },
        { name: 'LT',           nameAr: 'LT',            from: 2007, to: TO },
        { name: 'Z71',          nameAr: 'Z71',           from: 2007, to: TO },
        { name: 'Premier',      nameAr: 'بريمير',        from: 2015, to: TO },
        { name: 'High Country', nameAr: 'هاي كانتري',   from: 2021, to: TO },
      ]},
      { name: 'Suburban', nameAr: 'سوبربان', trims: [
        { name: 'LS',           nameAr: 'LS',           from: 2007, to: TO },
        { name: 'LT',           nameAr: 'LT',           from: 2007, to: TO },
        { name: 'Premier',      nameAr: 'بريمير',       from: 2015, to: TO },
        { name: 'High Country', nameAr: 'هاي كانتري',  from: 2021, to: TO },
      ]},
      { name: 'Silverado', nameAr: 'سيلفرادو', trims: [
        { name: 'WT',           nameAr: 'WT',           from: 2014, to: TO },
        { name: 'Custom',       nameAr: 'كاستوم',       from: 2019, to: TO },
        { name: 'LT',           nameAr: 'LT',           from: 2014, to: TO },
        { name: 'LTZ',          nameAr: 'LTZ',          from: 2014, to: TO },
        { name: 'High Country', nameAr: 'هاي كانتري',  from: 2014, to: TO },
      ]},
      { name: 'TrailBlazer', nameAr: 'تريل بليزر', trims: [
        { name: 'LS',    nameAr: 'LS',    from: 2021, to: TO },
        { name: 'LT',    nameAr: 'LT',    from: 2021, to: TO },
        { name: 'RS',    nameAr: 'RS',    from: 2021, to: TO },
        { name: 'Activ', nameAr: 'أكتيف', from: 2021, to: TO },
      ]},
      { name: 'Colorado', nameAr: 'كولورادو', trims: [
        { name: 'WT',  nameAr: 'WT',  from: 2012, to: TO },
        { name: 'LT',  nameAr: 'LT',  from: 2012, to: TO },
        { name: 'Z71', nameAr: 'Z71', from: 2012, to: TO },
        { name: 'ZR2', nameAr: 'ZR2', from: 2017, to: TO },
      ]},
      { name: 'Captiva', nameAr: 'كابتيفا', trims: [
        { name: 'LS', nameAr: 'LS', from: 2007, to: TO },
        { name: 'LT', nameAr: 'LT', from: 2007, to: TO },
      ]},
      { name: 'Malibu', nameAr: 'ماليبو', trims: [
        { name: 'LS', nameAr: 'LS', from: 2013, to: 2024 },
        { name: 'LT', nameAr: 'LT', from: 2013, to: 2024 },
        { name: 'RS', nameAr: 'RS', from: 2019, to: 2024 },
      ]},
    ],
  },

  // ─── جي إم سي ─────────────────────────────────────────────────────
  {
    name: 'GMC', nameAr: 'جي إم سي', slug: 'gmc', isPopular: true,
    models: [
      { name: 'Yukon', nameAr: 'يوكن', trims: [
        { name: 'SLE',    nameAr: 'SLE',    from: 2007, to: TO },
        { name: 'SLT',    nameAr: 'SLT',    from: 2007, to: TO },
        { name: 'AT4',    nameAr: 'AT4',    from: 2021, to: TO },
        { name: 'Denali', nameAr: 'ديناللي', from: 2007, to: TO },
        { name: 'Denali Ultimate', nameAr: 'ديناللي ألتيمت', from: 2023, to: TO },
      ]},
      { name: 'Yukon XL', nameAr: 'يوكن XL', trims: [
        { name: 'SLE',    nameAr: 'SLE',    from: 2007, to: TO },
        { name: 'SLT',    nameAr: 'SLT',    from: 2007, to: TO },
        { name: 'AT4',    nameAr: 'AT4',    from: 2021, to: TO },
        { name: 'Denali', nameAr: 'ديناللي', from: 2007, to: TO },
      ]},
      { name: 'Sierra', nameAr: 'سييرا', trims: [
        { name: 'SLE',    nameAr: 'SLE',    from: 2014, to: TO },
        { name: 'SLT',    nameAr: 'SLT',    from: 2014, to: TO },
        { name: 'AT4',    nameAr: 'AT4',    from: 2019, to: TO },
        { name: 'Denali', nameAr: 'ديناللي', from: 2014, to: TO },
      ]},
      { name: 'Acadia', nameAr: 'أكاديا', trims: [
        { name: 'SLE',    nameAr: 'SLE',    from: 2013, to: TO },
        { name: 'SLT',    nameAr: 'SLT',    from: 2013, to: TO },
        { name: 'AT4',    nameAr: 'AT4',    from: 2022, to: TO },
        { name: 'Denali', nameAr: 'ديناللي', from: 2013, to: TO },
      ]},
      { name: 'Terrain', nameAr: 'تيرين', trims: [
        { name: 'SLE', nameAr: 'SLE', from: 2018, to: TO },
        { name: 'SLT', nameAr: 'SLT', from: 2018, to: TO },
        { name: 'AT4', nameAr: 'AT4', from: 2020, to: TO },
      ]},
      { name: 'Canyon', nameAr: 'كانيون', trims: [
        { name: 'SLE',    nameAr: 'SLE',    from: 2015, to: TO },
        { name: 'SLT',    nameAr: 'SLT',    from: 2015, to: TO },
        { name: 'AT4',    nameAr: 'AT4',    from: 2021, to: TO },
        { name: 'Denali', nameAr: 'ديناللي', from: 2022, to: TO },
      ]},
    ],
  },

  // ─── لكسوس ────────────────────────────────────────────────────────
  {
    name: 'Lexus', nameAr: 'لكسوس', slug: 'lexus', isPopular: true,
    models: [
      { name: 'LX 600', nameAr: 'LX 600', trims: [
        { name: 'Premium',      nameAr: 'بريميوم',      from: 2022, to: TO },
        { name: 'Luxury',       nameAr: 'لاكشري',       from: 2022, to: TO },
        { name: 'F Sport',      nameAr: 'F سبورت',      from: 2022, to: TO },
        { name: 'Ultra Luxury', nameAr: 'ألترا لاكشري', from: 2022, to: TO },
      ]},
      { name: 'LX 570', nameAr: 'LX 570', trims: [
        { name: 'Base',        nameAr: 'بيس',           from: 2008, to: 2021 },
        { name: 'Sport',       nameAr: 'سبورت',         from: 2016, to: 2021 },
        { name: 'Black Edition',nameAr: 'بلاك إديشن',  from: 2017, to: 2021 },
      ]},
      { name: 'GX 460', nameAr: 'GX 460', trims: [
        { name: 'Base',    nameAr: 'بيس',    from: 2010, to: TO },
        { name: 'Premium', nameAr: 'بريميوم', from: 2010, to: TO },
        { name: 'Luxury',  nameAr: 'لاكشري', from: 2020, to: TO },
      ]},
      { name: 'RX 350', nameAr: 'RX 350', trims: [
        { name: 'Base',    nameAr: 'بيس',    from: 2010, to: TO },
        { name: 'Premium', nameAr: 'بريميوم', from: 2010, to: TO },
        { name: 'Luxury',  nameAr: 'لاكشري', from: 2016, to: TO },
      ]},
      { name: 'ES 300h', nameAr: 'ES 300h', trims: [
        { name: 'Base',          nameAr: 'بيس',          from: 2019, to: TO },
        { name: 'Premium',       nameAr: 'بريميوم',       from: 2019, to: TO },
        { name: 'Ultra Luxury',  nameAr: 'ألترا لاكشري', from: 2019, to: TO },
      ]},
      { name: 'ES 350', nameAr: 'ES 350', trims: [
        { name: 'Base',    nameAr: 'بيس',    from: 2007, to: TO },
        { name: 'Premium', nameAr: 'بريميوم', from: 2007, to: TO },
        { name: 'Luxury',  nameAr: 'لاكشري', from: 2019, to: TO },
      ]},
      { name: 'IS 300', nameAr: 'IS 300', trims: [
        { name: 'Base',    nameAr: 'بيس',    from: 2014, to: TO },
        { name: 'F Sport', nameAr: 'F سبورت', from: 2014, to: TO },
      ]},
      { name: 'NX 250', nameAr: 'NX 250', trims: [
        { name: 'Base',    nameAr: 'بيس',    from: 2022, to: TO },
        { name: 'Premium', nameAr: 'بريميوم', from: 2022, to: TO },
        { name: 'Luxury',  nameAr: 'لاكشري', from: 2022, to: TO },
        { name: 'F Sport', nameAr: 'F سبورت', from: 2022, to: TO },
      ]},
      { name: 'LS 500', nameAr: 'LS 500', trims: [
        { name: 'Base',    nameAr: 'بيس',    from: 2018, to: TO },
        { name: 'Luxury',  nameAr: 'لاكشري', from: 2018, to: TO },
        { name: 'F Sport', nameAr: 'F سبورت', from: 2018, to: TO },
      ]},
    ],
  },

  // ─── بي إم دبليو ──────────────────────────────────────────────────
  {
    name: 'BMW', nameAr: 'بي إم دبليو', slug: 'bmw', isPopular: false,
    models: [
      { name: '3 Series', nameAr: 'الفئة الثالثة', trims: [
        { name: '318i',  nameAr: '318i',  from: 2015, to: TO },
        { name: '320i',  nameAr: '320i',  from: 2015, to: TO },
        { name: '330i',  nameAr: '330i',  from: 2019, to: TO },
        { name: 'M340i', nameAr: 'M340i', from: 2020, to: TO },
        { name: 'M3',    nameAr: 'M3',    from: 2021, to: TO },
      ]},
      { name: '5 Series', nameAr: 'الفئة الخامسة', trims: [
        { name: '520i',  nameAr: '520i',  from: 2017, to: TO },
        { name: '530i',  nameAr: '530i',  from: 2017, to: TO },
        { name: '540i',  nameAr: '540i',  from: 2017, to: TO },
        { name: 'M550i', nameAr: 'M550i', from: 2018, to: TO },
        { name: 'M5',    nameAr: 'M5',    from: 2018, to: TO },
      ]},
      { name: '7 Series', nameAr: 'الفئة السابعة', trims: [
        { name: '730i',  nameAr: '730i',  from: 2016, to: TO },
        { name: '740i',  nameAr: '740i',  from: 2016, to: TO },
        { name: '750i',  nameAr: '750i',  from: 2016, to: TO },
        { name: 'M760i', nameAr: 'M760i', from: 2016, to: TO },
      ]},
      { name: 'X3', nameAr: 'X3', trims: [
        { name: 'sDrive20i', nameAr: 'sDrive20i', from: 2018, to: TO },
        { name: 'xDrive30i', nameAr: 'xDrive30i', from: 2018, to: TO },
        { name: 'M40i',      nameAr: 'M40i',      from: 2018, to: TO },
        { name: 'M',         nameAr: 'M',         from: 2020, to: TO },
      ]},
      { name: 'X5', nameAr: 'X5', trims: [
        { name: 'sDrive40i', nameAr: 'sDrive40i', from: 2019, to: TO },
        { name: 'xDrive40i', nameAr: 'xDrive40i', from: 2019, to: TO },
        { name: 'M50i',      nameAr: 'M50i',      from: 2019, to: TO },
        { name: 'M Competition', nameAr: 'M كومبيتيشن', from: 2020, to: TO },
      ]},
      { name: 'X6', nameAr: 'X6', trims: [
        { name: 'xDrive40i',     nameAr: 'xDrive40i',    from: 2015, to: TO },
        { name: 'M50i',          nameAr: 'M50i',         from: 2020, to: TO },
        { name: 'M Competition', nameAr: 'M كومبيتيشن', from: 2020, to: TO },
      ]},
      { name: 'X7', nameAr: 'X7', trims: [
        { name: 'xDrive40i', nameAr: 'xDrive40i', from: 2019, to: TO },
        { name: 'M60i',      nameAr: 'M60i',      from: 2019, to: TO },
        { name: 'Alpina XB7', nameAr: 'ألبينا XB7', from: 2020, to: TO },
      ]},
      { name: 'M4', nameAr: 'M4', trims: [
        { name: 'Competition',      nameAr: 'كومبيتيشن',      from: 2021, to: TO },
        { name: 'Competition xDrive',nameAr: 'كومبيتيشن xDrive', from: 2022, to: TO },
        { name: 'CSL',              nameAr: 'CSL',             from: 2023, to: TO },
      ]},
    ],
  },

  // ─── مرسيدس ───────────────────────────────────────────────────────
  {
    name: 'Mercedes-Benz', nameAr: 'مرسيدس بنز', slug: 'mercedes-benz', isPopular: false,
    models: [
      { name: 'C-Class', nameAr: 'الفئة C', trims: [
        { name: 'C200',    nameAr: 'C200',    from: 2014, to: TO },
        { name: 'C300',    nameAr: 'C300',    from: 2014, to: TO },
        { name: 'C43 AMG', nameAr: 'C43 AMG', from: 2016, to: TO },
        { name: 'C63 AMG', nameAr: 'C63 AMG', from: 2015, to: TO },
        { name: 'C63 S AMG', nameAr: 'C63 S AMG', from: 2015, to: TO },
      ]},
      { name: 'E-Class', nameAr: 'الفئة E', trims: [
        { name: 'E200',    nameAr: 'E200',    from: 2010, to: TO },
        { name: 'E300',    nameAr: 'E300',    from: 2017, to: TO },
        { name: 'E350',    nameAr: 'E350',    from: 2010, to: TO },
        { name: 'E53 AMG', nameAr: 'E53 AMG', from: 2019, to: TO },
        { name: 'E63 AMG S', nameAr: 'E63 AMG S', from: 2017, to: TO },
      ]},
      { name: 'S-Class', nameAr: 'الفئة S', trims: [
        { name: 'S400',      nameAr: 'S400',      from: 2014, to: TO },
        { name: 'S450',      nameAr: 'S450',      from: 2018, to: TO },
        { name: 'S500',      nameAr: 'S500',      from: 2014, to: TO },
        { name: 'S580',      nameAr: 'S580',      from: 2021, to: TO },
        { name: 'AMG S63',   nameAr: 'AMG S63',   from: 2014, to: TO },
        { name: 'Maybach S580', nameAr: 'مايباخ S580', from: 2021, to: TO },
      ]},
      { name: 'GLE', nameAr: 'GLE', trims: [
        { name: 'GLE300d',  nameAr: 'GLE300d',  from: 2016, to: TO },
        { name: 'GLE350',   nameAr: 'GLE350',   from: 2016, to: TO },
        { name: 'GLE450',   nameAr: 'GLE450',   from: 2020, to: TO },
        { name: 'GLE53 AMG',nameAr: 'GLE53 AMG',from: 2020, to: TO },
        { name: 'GLE63 AMG S',nameAr:'GLE63 AMG S',from:2016,to:TO },
      ]},
      { name: 'GLS', nameAr: 'GLS', trims: [
        { name: 'GLS450',      nameAr: 'GLS450',      from: 2017, to: TO },
        { name: 'GLS580',      nameAr: 'GLS580',      from: 2020, to: TO },
        { name: 'AMG GLS63',   nameAr: 'AMG GLS63',   from: 2017, to: TO },
        { name: 'Maybach GLS600', nameAr: 'مايباخ GLS600', from: 2021, to: TO },
      ]},
      { name: 'GLC', nameAr: 'GLC', trims: [
        { name: 'GLC200',    nameAr: 'GLC200',    from: 2016, to: TO },
        { name: 'GLC300',    nameAr: 'GLC300',    from: 2016, to: TO },
        { name: 'GLC43 AMG', nameAr: 'GLC43 AMG', from: 2016, to: TO },
        { name: 'GLC63 AMG S', nameAr: 'GLC63 AMG S', from: 2018, to: TO },
      ]},
      { name: 'G-Class', nameAr: 'جي كلاس', trims: [
        { name: 'G500',    nameAr: 'G500',    from: 2012, to: TO },
        { name: 'G63 AMG', nameAr: 'G63 AMG', from: 2012, to: TO },
        { name: 'G63 Edition 1', nameAr: 'G63 إديشن 1', from: 2019, to: TO },
      ]},
      { name: 'GLA', nameAr: 'GLA', trims: [
        { name: 'GLA200', nameAr: 'GLA200', from: 2014, to: TO },
        { name: 'GLA250', nameAr: 'GLA250', from: 2021, to: TO },
        { name: 'AMG GLA35', nameAr: 'AMG GLA35', from: 2021, to: TO },
      ]},
      { name: 'GLB', nameAr: 'GLB', trims: [
        { name: 'GLB200', nameAr: 'GLB200', from: 2020, to: TO },
        { name: 'GLB250', nameAr: 'GLB250', from: 2020, to: TO },
        { name: 'AMG GLB35', nameAr: 'AMG GLB35', from: 2020, to: TO },
      ]},
    ],
  },

  // ─── أودي ─────────────────────────────────────────────────────────
  {
    name: 'Audi', nameAr: 'أودي', slug: 'audi', isPopular: false,
    models: [
      { name: 'A4', nameAr: 'A4', trims: [
        { name: '35 TFSI', nameAr: '35 TFSI', from: 2019, to: TO },
        { name: '40 TFSI', nameAr: '40 TFSI', from: 2016, to: TO },
        { name: '45 TFSI', nameAr: '45 TFSI', from: 2016, to: TO },
        { name: 'S4',      nameAr: 'S4',      from: 2017, to: TO },
      ]},
      { name: 'A6', nameAr: 'A6', trims: [
        { name: '40 TFSI', nameAr: '40 TFSI', from: 2019, to: TO },
        { name: '45 TFSI', nameAr: '45 TFSI', from: 2019, to: TO },
        { name: '55 TFSI', nameAr: '55 TFSI', from: 2019, to: TO },
        { name: 'S6',      nameAr: 'S6',      from: 2020, to: TO },
        { name: 'RS6',     nameAr: 'RS6',     from: 2020, to: TO },
      ]},
      { name: 'A8', nameAr: 'A8', trims: [
        { name: '50 TDI',   nameAr: '50 TDI',  from: 2018, to: TO },
        { name: '55 TFSI',  nameAr: '55 TFSI', from: 2018, to: TO },
        { name: '60 TFSI',  nameAr: '60 TFSI', from: 2018, to: TO },
        { name: 'S8',       nameAr: 'S8',      from: 2020, to: TO },
      ]},
      { name: 'Q5', nameAr: 'Q5', trims: [
        { name: '40 TFSI', nameAr: '40 TFSI', from: 2017, to: TO },
        { name: '45 TFSI', nameAr: '45 TFSI', from: 2017, to: TO },
        { name: 'SQ5',     nameAr: 'SQ5',     from: 2018, to: TO },
        { name: 'RSQ5',    nameAr: 'RSQ5',    from: 2020, to: TO },
      ]},
      { name: 'Q7', nameAr: 'Q7', trims: [
        { name: '45 TFSI', nameAr: '45 TFSI', from: 2016, to: TO },
        { name: '55 TFSI', nameAr: '55 TFSI', from: 2016, to: TO },
        { name: 'SQ7',     nameAr: 'SQ7',     from: 2020, to: TO },
      ]},
      { name: 'Q8', nameAr: 'Q8', trims: [
        { name: '55 TFSI', nameAr: '55 TFSI', from: 2019, to: TO },
        { name: 'SQ8',     nameAr: 'SQ8',     from: 2020, to: TO },
        { name: 'RS Q8',   nameAr: 'RS Q8',   from: 2020, to: TO },
      ]},
      { name: 'Q3', nameAr: 'Q3', trims: [
        { name: '35 TFSI', nameAr: '35 TFSI', from: 2019, to: TO },
        { name: '40 TFSI', nameAr: '40 TFSI', from: 2019, to: TO },
        { name: 'RS Q3',   nameAr: 'RS Q3',   from: 2020, to: TO },
      ]},
    ],
  },

  // ─── دودج ─────────────────────────────────────────────────────────
  {
    name: 'Dodge', nameAr: 'دودج', slug: 'dodge', isPopular: false,
    models: [
      { name: 'Durango', nameAr: 'دورانجو', trims: [
        { name: 'SXT',      nameAr: 'SXT',      from: 2011, to: TO },
        { name: 'GT',       nameAr: 'GT',       from: 2018, to: TO },
        { name: 'R/T',      nameAr: 'R/T',      from: 2011, to: TO },
        { name: 'Citadel',  nameAr: 'سيتادل',   from: 2011, to: TO },
        { name: 'SRT',      nameAr: 'SRT',      from: 2018, to: TO },
      ]},
      { name: 'Charger', nameAr: 'تشارجر', trims: [
        { name: 'SXT',      nameAr: 'SXT',      from: 2011, to: 2023 },
        { name: 'GT',       nameAr: 'GT',       from: 2018, to: 2023 },
        { name: 'R/T',      nameAr: 'R/T',      from: 2011, to: 2023 },
        { name: 'Scat Pack',nameAr: 'سكات باك', from: 2015, to: 2023 },
        { name: 'SRT Hellcat',nameAr: 'SRT هيلكات', from: 2015, to: 2023 },
      ]},
      { name: 'Challenger', nameAr: 'تشالنجر', trims: [
        { name: 'SXT',         nameAr: 'SXT',         from: 2009, to: 2023 },
        { name: 'GT',          nameAr: 'GT',          from: 2017, to: 2023 },
        { name: 'R/T',         nameAr: 'R/T',         from: 2009, to: 2023 },
        { name: 'Scat Pack',   nameAr: 'سكات باك',    from: 2015, to: 2023 },
        { name: 'SRT Hellcat', nameAr: 'SRT هيلكات', from: 2015, to: 2023 },
        { name: 'SRT Demon',   nameAr: 'SRT ديمون',   from: 2018, to: 2023 },
      ]},
      { name: 'RAM 1500', nameAr: 'RAM 1500', trims: [
        { name: 'Express',     nameAr: 'إكسبريس',    from: 2010, to: TO },
        { name: 'Big Horn',    nameAr: 'بيج هورن',   from: 2010, to: TO },
        { name: 'Laramie',     nameAr: 'لاراميه',    from: 2010, to: TO },
        { name: 'Limited',     nameAr: 'ليمتد',      from: 2014, to: TO },
        { name: 'Rebel',       nameAr: 'ريبل',       from: 2015, to: TO },
        { name: 'TRX',         nameAr: 'TRX',         from: 2021, to: TO },
      ]},
    ],
  },

  // ─── جيب ──────────────────────────────────────────────────────────
  {
    name: 'Jeep', nameAr: 'جيب', slug: 'jeep', isPopular: false,
    models: [
      { name: 'Wrangler', nameAr: 'رانجلر', trims: [
        { name: 'Sport',     nameAr: 'سبورت',    from: 2007, to: TO },
        { name: 'Sahara',    nameAr: 'سهارا',    from: 2007, to: TO },
        { name: 'Rubicon',   nameAr: 'روبيكون',  from: 2007, to: TO },
        { name: 'Unlimited Sport',  nameAr: 'أنليمتد سبورت',  from: 2007, to: TO },
        { name: 'Unlimited Sahara', nameAr: 'أنليمتد سهارا',  from: 2007, to: TO },
        { name: 'Unlimited Rubicon',nameAr: 'أنليمتد روبيكون',from: 2007, to: TO },
      ]},
      { name: 'Grand Cherokee', nameAr: 'جراند شيروكي', trims: [
        { name: 'Laredo',     nameAr: 'لاريدو',    from: 2011, to: TO },
        { name: 'Limited',    nameAr: 'ليمتد',     from: 2011, to: TO },
        { name: 'Trailhawk',  nameAr: 'تريلهوك',   from: 2014, to: TO },
        { name: 'Summit',     nameAr: 'سميت',      from: 2011, to: TO },
        { name: 'SRT',        nameAr: 'SRT',        from: 2012, to: TO },
        { name: 'Trackhawk',  nameAr: 'تراك هوك',  from: 2018, to: TO },
      ]},
      { name: 'Gladiator', nameAr: 'غلاديتور', trims: [
        { name: 'Sport',    nameAr: 'سبورت',   from: 2020, to: TO },
        { name: 'Overland', nameAr: 'أوفرلاند', from: 2020, to: TO },
        { name: 'Rubicon',  nameAr: 'روبيكون', from: 2020, to: TO },
        { name: 'Mojave',   nameAr: 'موهاف',   from: 2021, to: TO },
      ]},
      { name: 'Compass', nameAr: 'كومباس', trims: [
        { name: 'Sport',    nameAr: 'سبورت',   from: 2017, to: TO },
        { name: 'Latitude', nameAr: 'لاتيتيود', from: 2017, to: TO },
        { name: 'Limited',  nameAr: 'ليمتد',   from: 2017, to: TO },
        { name: 'Trailhawk',nameAr: 'تريلهوك', from: 2017, to: TO },
      ]},
    ],
  },

  // ─── لاند روفر ────────────────────────────────────────────────────
  {
    name: 'Land Rover', nameAr: 'لاند روفر', slug: 'land-rover', isPopular: false,
    models: [
      { name: 'Range Rover', nameAr: 'رينج روفر', trims: [
        { name: 'SE',           nameAr: 'SE',            from: 2013, to: TO },
        { name: 'HSE',          nameAr: 'HSE',           from: 2013, to: TO },
        { name: 'Autobiography',nameAr: 'أوتوبيوجرافي', from: 2013, to: TO },
        { name: 'SV',           nameAr: 'SV',            from: 2023, to: TO },
      ]},
      { name: 'Range Rover Sport', nameAr: 'رينج روفر سبورت', trims: [
        { name: 'S',         nameAr: 'S',         from: 2023, to: TO },
        { name: 'SE',        nameAr: 'SE',        from: 2014, to: TO },
        { name: 'HSE',       nameAr: 'HSE',       from: 2014, to: TO },
        { name: 'Dynamic SE',nameAr: 'داينامك SE', from: 2014, to: TO },
        { name: 'SVR',       nameAr: 'SVR',       from: 2015, to: TO },
      ]},
      { name: 'Defender', nameAr: 'ديفندر', trims: [
        { name: '90 S',   nameAr: '90 S',   from: 2020, to: TO },
        { name: '90 SE',  nameAr: '90 SE',  from: 2020, to: TO },
        { name: '110 S',  nameAr: '110 S',  from: 2020, to: TO },
        { name: '110 SE', nameAr: '110 SE', from: 2020, to: TO },
        { name: '110 HSE',nameAr: '110 HSE',from: 2020, to: TO },
        { name: '110 X',  nameAr: '110 X',  from: 2020, to: TO },
      ]},
      { name: 'Discovery', nameAr: 'ديسكفري', trims: [
        { name: 'S',          nameAr: 'S',          from: 2017, to: TO },
        { name: 'SE',         nameAr: 'SE',          from: 2017, to: TO },
        { name: 'HSE',        nameAr: 'HSE',         from: 2017, to: TO },
        { name: 'R-Dynamic',  nameAr: 'R-داينامك',   from: 2021, to: TO },
      ]},
      { name: 'Discovery Sport', nameAr: 'ديسكفري سبورت', trims: [
        { name: 'S',   nameAr: 'S',   from: 2015, to: TO },
        { name: 'SE',  nameAr: 'SE',  from: 2015, to: TO },
        { name: 'HSE', nameAr: 'HSE', from: 2015, to: TO },
      ]},
    ],
  },

  // ─── إنفينيتي ─────────────────────────────────────────────────────
  {
    name: 'Infiniti', nameAr: 'إنفينيتي', slug: 'infiniti', isPopular: false,
    models: [
      { name: 'QX80', nameAr: 'QX80', trims: [
        { name: 'Luxe',      nameAr: 'لاكس',      from: 2014, to: TO },
        { name: 'Sensory',   nameAr: 'سينسوري',   from: 2018, to: TO },
        { name: 'Autograph', nameAr: 'أوتوجراف',  from: 2022, to: TO },
      ]},
      { name: 'QX60', nameAr: 'QX60', trims: [
        { name: 'Pure',      nameAr: 'بيور',      from: 2022, to: TO },
        { name: 'Luxe',      nameAr: 'لاكس',      from: 2022, to: TO },
        { name: 'Sensory',   nameAr: 'سينسوري',   from: 2022, to: TO },
        { name: 'Autograph', nameAr: 'أوتوجراف',  from: 2022, to: TO },
      ]},
      { name: 'Q50', nameAr: 'Q50', trims: [
        { name: 'Pure',    nameAr: 'بيور',    from: 2014, to: TO },
        { name: 'Luxe',    nameAr: 'لاكس',    from: 2014, to: TO },
        { name: 'Sport',   nameAr: 'سبورت',   from: 2016, to: TO },
        { name: 'Red Sport 400', nameAr: 'ريد سبورت 400', from: 2016, to: TO },
      ]},
      { name: 'QX50', nameAr: 'QX50', trims: [
        { name: 'Pure',      nameAr: 'بيور',     from: 2019, to: TO },
        { name: 'Luxe',      nameAr: 'لاكس',     from: 2019, to: TO },
        { name: 'Autograph', nameAr: 'أوتوجراف', from: 2019, to: TO },
      ]},
      { name: 'QX55', nameAr: 'QX55', trims: [
        { name: 'Pure',      nameAr: 'بيور',     from: 2022, to: TO },
        { name: 'Luxe',      nameAr: 'لاكس',     from: 2022, to: TO },
        { name: 'Sensory',   nameAr: 'سينسوري',  from: 2022, to: TO },
        { name: 'Autograph', nameAr: 'أوتوجراف', from: 2022, to: TO },
      ]},
    ],
  },

  // ─── مازدا ────────────────────────────────────────────────────────
  {
    name: 'Mazda', nameAr: 'مازدا', slug: 'mazda', isPopular: false,
    models: [
      { name: 'Mazda3', nameAr: 'مازدا 3', trims: [
        { name: 'Base',            nameAr: 'بيس',         from: 2019, to: TO },
        { name: 'Carbon Edition',  nameAr: 'كاربون',      from: 2021, to: TO },
        { name: 'Turbo',           nameAr: 'تيربو',       from: 2021, to: TO },
      ]},
      { name: 'Mazda6', nameAr: 'مازدا 6', trims: [
        { name: 'Base',      nameAr: 'بيس',     from: 2014, to: 2023 },
        { name: 'Sport',     nameAr: 'سبورت',   from: 2014, to: 2023 },
        { name: 'Signature', nameAr: 'سيجنتشر', from: 2018, to: 2023 },
      ]},
      { name: 'CX-5', nameAr: 'CX-5', trims: [
        { name: 'Sport',         nameAr: 'سبورت',     from: 2017, to: TO },
        { name: 'Touring',       nameAr: 'تورينج',    from: 2017, to: TO },
        { name: 'Grand Touring', nameAr: 'جراند تورينج', from: 2017, to: TO },
        { name: 'Signature',     nameAr: 'سيجنتشر',   from: 2021, to: TO },
      ]},
      { name: 'CX-9', nameAr: 'CX-9', trims: [
        { name: 'Sport',         nameAr: 'سبورت',        from: 2016, to: 2023 },
        { name: 'Touring',       nameAr: 'تورينج',       from: 2016, to: 2023 },
        { name: 'Grand Touring', nameAr: 'جراند تورينج', from: 2016, to: 2023 },
        { name: 'Signature',     nameAr: 'سيجنتشر',      from: 2018, to: 2023 },
      ]},
      { name: 'CX-90', nameAr: 'CX-90', trims: [
        { name: 'Base',          nameAr: 'بيس',          from: 2024, to: TO },
        { name: 'Premium',       nameAr: 'بريميوم',       from: 2024, to: TO },
        { name: 'Premium Plus',  nameAr: 'بريميوم بلس',  from: 2024, to: TO },
      ]},
      { name: 'BT-50', nameAr: 'BT-50', trims: [
        { name: 'XT',  nameAr: 'XT',  from: 2021, to: TO },
        { name: 'XTR', nameAr: 'XTR', from: 2021, to: TO },
        { name: 'SP',  nameAr: 'SP',  from: 2021, to: TO },
      ]},
    ],
  },

  // ─── فولكس واجن ───────────────────────────────────────────────────
  {
    name: 'Volkswagen', nameAr: 'فولكس واجن', slug: 'volkswagen', isPopular: false,
    models: [
      { name: 'Passat', nameAr: 'باسات', trims: [
        { name: 'Comfortline', nameAr: 'كومفورت لاين', from: 2016, to: 2025 },
        { name: 'Highline',    nameAr: 'هاي لاين',    from: 2016, to: 2025 },
        { name: 'R-Line',      nameAr: 'R لاين',      from: 2019, to: 2025 },
      ]},
      { name: 'Tiguan', nameAr: 'تيجوان', trims: [
        { name: 'Comfortline', nameAr: 'كومفورت لاين', from: 2017, to: TO },
        { name: 'Highline',    nameAr: 'هاي لاين',    from: 2017, to: TO },
        { name: 'R-Line',      nameAr: 'R لاين',      from: 2021, to: TO },
        { name: 'Elegance',    nameAr: 'إيليجانس',    from: 2021, to: TO },
      ]},
      { name: 'Touareg', nameAr: 'تواريج', trims: [
        { name: 'Elegance', nameAr: 'إيليجانس', from: 2018, to: TO },
        { name: 'R-Line',   nameAr: 'R لاين',   from: 2018, to: TO },
        { name: 'R',        nameAr: 'R',         from: 2021, to: TO },
      ]},
      { name: 'Teramont', nameAr: 'تيراموند', trims: [
        { name: 'Trendline', nameAr: 'ترند لاين', from: 2018, to: TO },
        { name: 'Highline',  nameAr: 'هاي لاين',  from: 2018, to: TO },
        { name: 'X',         nameAr: 'X',          from: 2021, to: TO },
      ]},
    ],
  },

  // ─── بورش ─────────────────────────────────────────────────────────
  {
    name: 'Porsche', nameAr: 'بورش', slug: 'porsche', isPopular: false,
    models: [
      { name: 'Cayenne', nameAr: 'كايين', trims: [
        { name: 'Base',      nameAr: 'بيس',      from: 2018, to: TO },
        { name: 'S',         nameAr: 'S',         from: 2018, to: TO },
        { name: 'GTS',       nameAr: 'GTS',       from: 2018, to: TO },
        { name: 'Turbo',     nameAr: 'تيربو',     from: 2018, to: TO },
        { name: 'Turbo GT',  nameAr: 'تيربو GT',  from: 2022, to: TO },
      ]},
      { name: 'Macan', nameAr: 'ماكان', trims: [
        { name: 'Base',  nameAr: 'بيس',  from: 2015, to: TO },
        { name: 'S',     nameAr: 'S',     from: 2015, to: TO },
        { name: 'GTS',   nameAr: 'GTS',   from: 2020, to: TO },
        { name: 'Turbo', nameAr: 'تيربو', from: 2015, to: TO },
      ]},
      { name: 'Panamera', nameAr: 'بانامير', trims: [
        { name: '4',     nameAr: '4',     from: 2017, to: TO },
        { name: '4S',    nameAr: '4S',    from: 2017, to: TO },
        { name: 'GTS',   nameAr: 'GTS',   from: 2019, to: TO },
        { name: 'Turbo', nameAr: 'تيربو', from: 2017, to: TO },
        { name: 'Turbo S',nameAr:'تيربو S',from:2021, to: TO },
      ]},
      { name: '911', nameAr: '911', trims: [
        { name: 'Carrera',   nameAr: 'كاريرا',   from: 2012, to: TO },
        { name: 'Carrera S', nameAr: 'كاريرا S', from: 2012, to: TO },
        { name: 'Carrera 4S',nameAr:'كاريرا 4S', from: 2012, to: TO },
        { name: 'Targa 4',   nameAr: 'تارجا 4',  from: 2014, to: TO },
        { name: 'Turbo',     nameAr: 'تيربو',     from: 2014, to: TO },
        { name: 'Turbo S',   nameAr: 'تيربو S',   from: 2014, to: TO },
        { name: 'GT3',       nameAr: 'GT3',        from: 2014, to: TO },
        { name: 'GT3 RS',    nameAr: 'GT3 RS',     from: 2016, to: TO },
      ]},
      { name: 'Taycan', nameAr: 'تايكان', trims: [
        { name: 'Base',  nameAr: 'بيس',  from: 2020, to: TO },
        { name: '4S',    nameAr: '4S',    from: 2020, to: TO },
        { name: 'GTS',   nameAr: 'GTS',   from: 2022, to: TO },
        { name: 'Turbo', nameAr: 'تيربو', from: 2020, to: TO },
        { name: 'Turbo S',nameAr:'تيربو S',from:2020, to: TO },
      ]},
    ],
  },

  // ─── كاديلاك ──────────────────────────────────────────────────────
  {
    name: 'Cadillac', nameAr: 'كاديلاك', slug: 'cadillac', isPopular: false,
    models: [
      { name: 'Escalade', nameAr: 'إسكالاد', trims: [
        { name: 'Luxury',           nameAr: 'لاكشري',          from: 2015, to: TO },
        { name: 'Premium Luxury',   nameAr: 'بريميوم لاكشري',  from: 2015, to: TO },
        { name: 'Sport',            nameAr: 'سبورت',           from: 2021, to: TO },
        { name: 'Sport Platinum',   nameAr: 'سبورت بلاتينيوم', from: 2021, to: TO },
      ]},
      { name: 'Escalade ESV', nameAr: 'إسكالاد ESV', trims: [
        { name: 'Luxury',         nameAr: 'لاكشري',        from: 2015, to: TO },
        { name: 'Premium Luxury', nameAr: 'بريميوم لاكشري', from: 2015, to: TO },
      ]},
      { name: 'XT5', nameAr: 'XT5', trims: [
        { name: 'Sport',           nameAr: 'سبورت',          from: 2017, to: TO },
        { name: 'Premium Luxury',  nameAr: 'بريميوم لاكشري', from: 2017, to: TO },
      ]},
      { name: 'CT5', nameAr: 'CT5', trims: [
        { name: 'Luxury',         nameAr: 'لاكشري',        from: 2020, to: TO },
        { name: 'Premium Luxury', nameAr: 'بريميوم لاكشري', from: 2020, to: TO },
        { name: 'Sport',          nameAr: 'سبورت',          from: 2020, to: TO },
        { name: 'V-Series',       nameAr: 'V سيريز',        from: 2022, to: TO },
      ]},
    ],
  },

  // ─── جينيسيس ──────────────────────────────────────────────────────
  {
    name: 'Genesis', nameAr: 'جينيسيس', slug: 'genesis', isPopular: false,
    models: [
      { name: 'G80', nameAr: 'G80', trims: [
        { name: 'Standard',   nameAr: 'ستاندرد',   from: 2021, to: TO },
        { name: 'Advanced',   nameAr: 'أدفانسد',   from: 2021, to: TO },
        { name: 'Sport',      nameAr: 'سبورت',     from: 2021, to: TO },
        { name: 'Electrified',nameAr: 'كهربائي',   from: 2023, to: TO },
      ]},
      { name: 'GV80', nameAr: 'GV80', trims: [
        { name: '2.5T',  nameAr: '2.5T',  from: 2021, to: TO },
        { name: '3.5T',  nameAr: '3.5T',  from: 2021, to: TO },
        { name: '3.5T Sport', nameAr: '3.5T سبورت', from: 2022, to: TO },
      ]},
      { name: 'G70', nameAr: 'G70', trims: [
        { name: '2.0T', nameAr: '2.0T', from: 2019, to: TO },
        { name: '3.3T', nameAr: '3.3T', from: 2019, to: TO },
        { name: '3.3T Sport', nameAr: '3.3T سبورت', from: 2019, to: TO },
      ]},
      { name: 'GV70', nameAr: 'GV70', trims: [
        { name: '2.5T',  nameAr: '2.5T',  from: 2022, to: TO },
        { name: '3.5T',  nameAr: '3.5T',  from: 2022, to: TO },
        { name: 'Sport', nameAr: 'سبورت', from: 2022, to: TO },
      ]},
    ],
  },

  // ─── إيسوزو ───────────────────────────────────────────────────────
  {
    name: 'Isuzu', nameAr: 'إيسوزو', slug: 'isuzu', isPopular: false,
    models: [
      { name: 'D-Max', nameAr: 'D-Max', trims: [
        { name: 'Base',    nameAr: 'بيس',     from: 2012, to: TO },
        { name: 'LS',      nameAr: 'LS',      from: 2012, to: TO },
        { name: 'V-Cross', nameAr: 'V-كروس',  from: 2012, to: TO },
        { name: 'AT35',    nameAr: 'AT35',    from: 2021, to: TO },
      ]},
      { name: 'MU-X', nameAr: 'MU-X', trims: [
        { name: 'LS',   nameAr: 'LS',   from: 2014, to: TO },
        { name: 'LS-A', nameAr: 'LS-A', from: 2021, to: TO },
      ]},
    ],
  },

  // ─── سوزوكي ───────────────────────────────────────────────────────
  {
    name: 'Suzuki', nameAr: 'سوزوكي', slug: 'suzuki', isPopular: false,
    models: [
      { name: 'Vitara', nameAr: 'فيتارا', trims: [
        { name: 'GLX', nameAr: 'GLX', from: 2015, to: TO },
        { name: 'GLX Turbo', nameAr: 'GLX تيربو', from: 2019, to: TO },
      ]},
      { name: 'Grand Vitara', nameAr: 'جراند فيتارا', trims: [
        { name: 'GL',  nameAr: 'GL',  from: 2005, to: TO },
        { name: 'GLX', nameAr: 'GLX', from: 2022, to: TO },
      ]},
      { name: 'Jimny', nameAr: 'جيمني', trims: [
        { name: 'GL',  nameAr: 'GL',  from: 2018, to: TO },
        { name: 'GLX', nameAr: 'GLX', from: 2022, to: TO },
      ]},
      { name: 'Swift', nameAr: 'سويفت', trims: [
        { name: 'GL',  nameAr: 'GL',  from: 2005, to: TO },
        { name: 'GLX', nameAr: 'GLX', from: 2005, to: TO },
        { name: 'Sport', nameAr: 'سبورت', from: 2018, to: TO },
      ]},
      { name: 'Dzire', nameAr: 'دزاير', trims: [
        { name: 'GL',  nameAr: 'GL',  from: 2018, to: TO },
        { name: 'GLX', nameAr: 'GLX', from: 2018, to: TO },
      ]},
      { name: 'Ciaz', nameAr: 'سياز', trims: [
        { name: 'GL',  nameAr: 'GL',  from: 2014, to: TO },
        { name: 'GLX', nameAr: 'GLX', from: 2014, to: TO },
      ]},
    ],
  },

  // ─── سوبارو ───────────────────────────────────────────────────────
  {
    name: 'Subaru', nameAr: 'سوبارو', slug: 'subaru', isPopular: false,
    models: [
      { name: 'Forester', nameAr: 'فورستر', trims: [
        { name: 'Base',     nameAr: 'بيس',      from: 2014, to: TO },
        { name: 'Premium',  nameAr: 'بريميوم',  from: 2014, to: TO },
        { name: 'Sport',    nameAr: 'سبورت',    from: 2019, to: TO },
        { name: 'Limited',  nameAr: 'ليمتد',    from: 2014, to: TO },
        { name: 'Touring',  nameAr: 'تورينج',   from: 2019, to: TO },
      ]},
      { name: 'Outback', nameAr: 'أوتباك', trims: [
        { name: 'Base',    nameAr: 'بيس',    from: 2015, to: TO },
        { name: 'Premium', nameAr: 'بريميوم', from: 2015, to: TO },
        { name: 'Limited', nameAr: 'ليمتد',  from: 2015, to: TO },
        { name: 'Touring', nameAr: 'تورينج', from: 2020, to: TO },
        { name: 'Wilderness',nameAr:'وايلدرنس',from:2022,to:TO },
      ]},
      { name: 'XV', nameAr: 'XV', trims: [
        { name: 'Base',    nameAr: 'بيس',    from: 2018, to: TO },
        { name: 'Premium', nameAr: 'بريميوم', from: 2018, to: TO },
        { name: 'Sport',   nameAr: 'سبورت',  from: 2018, to: TO },
      ]},
      { name: 'WRX', nameAr: 'WRX', trims: [
        { name: 'Base',    nameAr: 'بيس',    from: 2015, to: TO },
        { name: 'Premium', nameAr: 'بريميوم', from: 2015, to: TO },
        { name: 'Limited', nameAr: 'ليمتد',  from: 2015, to: TO },
        { name: 'GT',      nameAr: 'GT',     from: 2022, to: TO },
        { name: 'STI',     nameAr: 'STI',    from: 2015, to: 2021 },
      ]},
      { name: 'BRZ', nameAr: 'BRZ', trims: [
        { name: 'Base',    nameAr: 'بيس',    from: 2013, to: TO },
        { name: 'Limited', nameAr: 'ليمتد',  from: 2013, to: TO },
        { name: 'tS',      nameAr: 'tS',     from: 2022, to: TO },
      ]},
    ],
  },
];
