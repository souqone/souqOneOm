const fs = require('fs');

// Patch GeoService
const geoPath = 'apps/api/src/locations/geo.service.ts';
let geoContent = fs.readFileSync(geoPath, 'utf8');
const getLocationNamesCode = 
  /**
   * Helper to fetch Arabic location names (e.g. for backwards compatibility in old columns)
   */
  async getLocationNames(governorateId?: number, wilayaId?: number) {
    let governorateName = null;
    let wilayaName = null;
    if (governorateId) {
      const gov = await this.prisma.governorate.findUnique({ where: { id: governorateId } });
      if (gov) governorateName = gov.nameAr;
    }
    if (wilayaId) {
      const wilaya = await this.prisma.wilaya.findUnique({ where: { id: wilayaId } });
      if (wilaya) wilayaName = wilaya.nameAr;
    }
    return { governorateName, wilayaName };
  }
;
geoContent = geoContent.replace('async clearLocation(', getLocationNamesCode + '\n  async clearLocation(');
fs.writeFileSync(geoPath, geoContent);

// Patch ServicesService
const svcPath = 'apps/api/src/services/services.service.ts';
let svcContent = fs.readFileSync(svcPath, 'utf8');

// Update buildCreateData to pass through governorate and city
svcContent = svcContent.replace('wilayaId: dto.wilayaId,', 'wilayaId: dto.wilayaId,\n      governorate: (dto as any).governorate,\n      city: (dto as any).city,');

// Update create method
svcContent = svcContent.replace(
  'const item = await super.create(dto, userId);',
  'const locs = await this.geoService.getLocationNames(dto.governorateId, dto.wilayaId);\n    (dto as any).governorate = locs.governorateName;\n    (dto as any).city = locs.wilayaName;\n\n    const item = await super.create(dto, userId);'
);

// Update update method
svcContent = svcContent.replace(
  'const item = await super.update(id, userId, dto);',
  'if (dto.governorateId !== undefined || dto.wilayaId !== undefined) {\n      const nextGovId = dto.governorateId !== undefined ? dto.governorateId : existing?.governorateId;\n      const nextWilayaId = dto.wilayaId !== undefined ? dto.wilayaId : existing?.wilayaId;\n      const locs = await this.geoService.getLocationNames(nextGovId, nextWilayaId);\n      if (locs.governorateName) (dto as any).governorate = locs.governorateName;\n      if (locs.wilayaName) (dto as any).city = locs.wilayaName;\n    }\n\n    const item = await super.update(id, userId, dto);'
);

fs.writeFileSync(svcPath, svcContent);
console.log('Patched backend files successfully!');
