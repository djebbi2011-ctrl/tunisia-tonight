import { PrismaClient, Role, ContractStatus, MealPlan } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAvailabilities(roomIds: { id: string; total: number }[]) {
  const today = new Date();
  for (const room of roomIds) {
    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      date.setHours(0, 0, 0, 0);
      const available = Math.max(0, room.total - Math.floor(Math.random() * 3));
      await prisma.availability.upsert({
        where: { roomTypeId_date: { roomTypeId: room.id, date } },
        update: {},
        create: { roomTypeId: room.id, date, totalRooms: room.total, availableRooms: available, isClosed: false },
      });
    }
  }
}

async function makeHotelier(email: string, firstName: string, lastName: string) {
  const pass = await bcrypt.hash('Hotelier@2026!', 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash: pass, role: Role.HOTELIER, firstName, lastName },
  });
}

async function seedRates(contractId: string, rates: { id: string; roomTypeId: string; mealPlan: MealPlan; p1: number; p2: number; p3: number; commPct: number }[]) {
  for (const r of rates) {
    await prisma.contractRate.upsert({ where: { id: r.id },       update: {}, create: { id: r.id,        contractId, roomTypeId: r.roomTypeId, mealPlan: r.mealPlan, basePriceTnd: r.p1, commissionPct: r.commPct, minStay: 1 } });
    await prisma.contractRate.upsert({ where: { id: r.id+'_2n' }, update: {}, create: { id: r.id+'_2n',  contractId, roomTypeId: r.roomTypeId, mealPlan: r.mealPlan, basePriceTnd: r.p2, commissionPct: r.commPct, minStay: 2 } });
    await prisma.contractRate.upsert({ where: { id: r.id+'_3n' }, update: {}, create: { id: r.id+'_3n',  contractId, roomTypeId: r.roomTypeId, mealPlan: r.mealPlan, basePriceTnd: r.p3, commissionPct: r.commPct, minStay: 3 } });
  }
}

async function main() {
  console.log('🌱 Seeding Tunisia Tonight...');

  // ── USERS ──────────────────────────────────────────────────────────────────
  const adminPass = await bcrypt.hash('Admin@2026!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tunisiatonight.com' },
    update: {},
    create: { email: 'admin@tunisiatonight.com', passwordHash: adminPass, role: Role.SUPER_ADMIN, firstName: 'Joseph', lastName: 'Admin' },
  });
  const hBarceloBarcelo  = await makeHotelier('barcelo@tunisiatonight.com',    'Mohamed', 'Ben Ali');
  const hTelemaque       = await makeHotelier('telemaque@tunisiatonight.com',   'Nabil',   'Ferchichi');
  const hKarthago        = await makeHotelier('karthago@tunisiatonight.com',    'Hanen',   'Jouini');
  const hHilton          = await makeHotelier('hilton@tunisiatonight.com',      'Karim',   'Abdelaziz');
  const hRoyalAzur       = await makeHotelier('royalazur@tunisiatonight.com',   'Sami',    'Trabelsi');
  const hGoldenTulip     = await makeHotelier('goldentulip@tunisiatonight.com', 'Ines',    'Mansouri');
  const clientPass = await bcrypt.hash('Client@2026!', 10);
  await prisma.user.upsert({ where: { email: 'sonia@test.tn' }, update: {}, create: { email: 'sonia@test.tn', passwordHash: clientPass, role: Role.CLIENT, firstName: 'Sonia', lastName: 'Khalil', phone: '+21698000001' } });
  console.log('✅ Utilisateurs créés');

  // ══════════════════════════════════════════════════════════════════════════
  // 1. BARCELÓ MONASTIR
  // ══════════════════════════════════════════════════════════════════════════
  const barcelo = await prisma.hotel.upsert({ where: { id: 'hotel-barcelo-monastir' }, update: {}, create: {
    id: 'hotel-barcelo-monastir', name: 'Barceló Monastir Thalasso & Golf', stars: 4,
    city: 'Monastir', region: 'Centre-Est', address: 'Route Touristique, Skanes, Monastir 5000',
    latitude: 35.7333, longitude: 10.8000,
    description: 'Resort 4★ en bord de mer avec thalasso, piscines chauffées, golf 18 trous et plage privée.',
    phone: '+21673500001', email: 'info@barcelo-monastir.tn',
    amenities: JSON.stringify(['piscine','spa','thalasso','wifi','parking','restaurant','plage_privee','golf','animation']),
    photos: [], isActive: true, hotelierUserId: hBarceloBarcelo.id,
  }});
  const bStd  = await prisma.roomType.upsert({ where: { id: 'room-b-std'  }, update: {}, create: { id: 'room-b-std',  hotelId: barcelo.id, name: 'Standard Jardin',    description: '28m² — Vue jardin, double ou twin', capacity: 2, bedType: 'Double/Twin', viewType: 'Jardin',  photos: [], amenities: JSON.stringify(['clim','tv','minibar','balcon']) } });
  const bSup  = await prisma.roomType.upsert({ where: { id: 'room-b-sup'  }, update: {}, create: { id: 'room-b-sup',  hotelId: barcelo.id, name: 'Supérieure Piscine', description: '32m² — Vue piscine',                capacity: 2, bedType: 'Double',       viewType: 'Piscine', photos: [], amenities: JSON.stringify(['clim','tv','minibar','balcon','vue_piscine']) } });
  const bMer  = await prisma.roomType.upsert({ where: { id: 'room-b-mer'  }, update: {}, create: { id: 'room-b-mer',  hotelId: barcelo.id, name: 'Vue Mer',            description: '35m² — Vue directe mer, King bed', capacity: 2, bedType: 'King',         viewType: 'Mer',     photos: [], amenities: JSON.stringify(['clim','tv','minibar','balcon','vue_mer']) } });
  const cBarc = await prisma.contract.upsert({ where: { id: 'contract-barcelo-2026' }, update: {}, create: { id: 'contract-barcelo-2026', hotelId: barcelo.id, label: 'Saison 2026', seasonStart: new Date('2026-01-01'), seasonEnd: new Date('2026-12-31'), status: ContractStatus.ACTIVE, uploadedById: admin.id } });
  await seedRates(cBarc.id, [
    { id: 'rb-std-bb', roomTypeId: bStd.id, mealPlan: MealPlan.BREAKFAST,  p1:189, p2:175, p3:159, commPct:8 },
    { id: 'rb-std-hb', roomTypeId: bStd.id, mealPlan: MealPlan.HALF_BOARD, p1:229, p2:215, p3:199, commPct:8 },
    { id: 'rb-sup-bb', roomTypeId: bSup.id, mealPlan: MealPlan.BREAKFAST,  p1:249, p2:235, p3:219, commPct:8 },
    { id: 'rb-sup-hb', roomTypeId: bSup.id, mealPlan: MealPlan.HALF_BOARD, p1:289, p2:275, p3:259, commPct:8 },
    { id: 'rb-mer-bb', roomTypeId: bMer.id, mealPlan: MealPlan.BREAKFAST,  p1:329, p2:309, p3:289, commPct:8 },
    { id: 'rb-mer-hb', roomTypeId: bMer.id, mealPlan: MealPlan.HALF_BOARD, p1:369, p2:349, p3:329, commPct:8 },
  ]);
  await seedAvailabilities([{ id: bStd.id, total: 10 }, { id: bSup.id, total: 6 }, { id: bMer.id, total: 5 }]);
  console.log('✅ Barceló Monastir');

  // ══════════════════════════════════════════════════════════════════════════
  // 2. HILTON SKANES MONASTIR
  // ══════════════════════════════════════════════════════════════════════════
  const hilton = await prisma.hotel.upsert({ where: { id: 'hotel-hilton-skanes' }, update: {}, create: {
    id: 'hotel-hilton-skanes', name: 'Hilton Monastir & Residences', stars: 5,
    city: 'Monastir', region: 'Centre-Est', address: 'Route de la Corniche, Skanes, Monastir 5000',
    latitude: 35.7280, longitude: 10.8120,
    description: 'Le seul Hilton de Tunisie. 247 chambres et suites face à la mer, spa Eforea, 5 restaurants, accès direct plage.',
    phone: '+21673521444', email: 'info@hiltonmonastir.tn',
    amenities: JSON.stringify(['piscine','spa_eforea','wifi','parking','5_restaurants','plage_privee','fitness','tennis','kids_club']),
    photos: [], isActive: true, hotelierUserId: hHilton.id,
  }});
  const hStd  = await prisma.roomType.upsert({ where: { id: 'room-h-std'  }, update: {}, create: { id: 'room-h-std',  hotelId: hilton.id, name: 'Hilton Guestroom',  description: '32m² — Vue mer ou jardin',          capacity: 2, bedType: 'King/Twin', viewType: 'Mer/Jardin',  photos: [], amenities: JSON.stringify(['clim','tv_4k','minibar','coffre','bain_douche']) } });
  const hDlx  = await prisma.roomType.upsert({ where: { id: 'room-h-dlx'  }, update: {}, create: { id: 'room-h-dlx',  hotelId: hilton.id, name: 'Deluxe Sea View',  description: '36m² — Vue mer garantie, balcon',   capacity: 2, bedType: 'King',      viewType: 'Mer',         photos: [], amenities: JSON.stringify(['clim','tv_4k','minibar','coffre','balcon','vue_mer']) } });
  const hSte  = await prisma.roomType.upsert({ where: { id: 'room-h-ste'  }, update: {}, create: { id: 'room-h-ste',  hotelId: hilton.id, name: 'Junior Suite',     description: '52m² — Salon séparé, vue mer',      capacity: 2, bedType: 'King',      viewType: 'Mer',         photos: [], amenities: JSON.stringify(['clim','tv_4k','minibar','coffre','salon','acces_lounge']) } });
  const cHilt = await prisma.contract.upsert({ where: { id: 'contract-hilton-2026' }, update: {}, create: { id: 'contract-hilton-2026', hotelId: hilton.id, label: 'Saison 2026', seasonStart: new Date('2026-01-01'), seasonEnd: new Date('2026-12-31'), status: ContractStatus.ACTIVE, uploadedById: admin.id } });
  await seedRates(cHilt.id, [
    { id: 'rh-std-bb', roomTypeId: hStd.id, mealPlan: MealPlan.BREAKFAST,  p1:289, p2:269, p3:249, commPct:10 },
    { id: 'rh-std-hb', roomTypeId: hStd.id, mealPlan: MealPlan.HALF_BOARD, p1:339, p2:319, p3:299, commPct:10 },
    { id: 'rh-dlx-bb', roomTypeId: hDlx.id, mealPlan: MealPlan.BREAKFAST,  p1:379, p2:359, p3:339, commPct:10 },
    { id: 'rh-dlx-hb', roomTypeId: hDlx.id, mealPlan: MealPlan.HALF_BOARD, p1:429, p2:409, p3:389, commPct:10 },
    { id: 'rh-ste-bb', roomTypeId: hSte.id, mealPlan: MealPlan.BREAKFAST,  p1:549, p2:519, p3:489, commPct:10 },
    { id: 'rh-ste-hb', roomTypeId: hSte.id, mealPlan: MealPlan.HALF_BOARD, p1:599, p2:569, p3:539, commPct:10 },
  ]);
  await seedAvailabilities([{ id: hStd.id, total: 12 }, { id: hDlx.id, total: 8 }, { id: hSte.id, total: 4 }]);
  console.log('✅ Hilton Skanes Monastir');

  // ══════════════════════════════════════════════════════════════════════════
  // 3. TÉLÉMAQUE BEACH & SPA DJERBA
  // ══════════════════════════════════════════════════════════════════════════
  const telemaque = await prisma.hotel.upsert({ where: { id: 'hotel-telemaque-djerba' }, update: {}, create: {
    id: 'hotel-telemaque-djerba', name: 'Télémaque Beach & Spa', stars: 4,
    city: 'Djerba', region: 'Sud', address: 'Zone Touristique de Midoun, Djerba 4116',
    latitude: 33.8420, longitude: 10.9800,
    description: 'Hôtel 4★ à 50m de la plage de Djerba. Spa, thalasso, animations et vue imprenable sur le lagon.',
    phone: '+21675758000', email: 'reservation@telemaque-djerba.tn',
    amenities: JSON.stringify(['piscine','spa','thalasso','wifi','parking','restaurant','plage','animation','hammam']),
    photos: [], isActive: true, hotelierUserId: hTelemaque.id,
  }});
  const tStd  = await prisma.roomType.upsert({ where: { id: 'room-t-std'  }, update: {}, create: { id: 'room-t-std',  hotelId: telemaque.id, name: 'Standard',        description: '26m² — Vue jardin ou piscine',    capacity: 2, bedType: 'Double/Twin', viewType: 'Jardin', photos: [], amenities: JSON.stringify(['clim','tv','douche','wifi','terrasse']) } });
  const tSup  = await prisma.roomType.upsert({ where: { id: 'room-t-sup'  }, update: {}, create: { id: 'room-t-sup',  hotelId: telemaque.id, name: 'Supérieure Lagon', description: '30m² — Vue lagon et mer',         capacity: 2, bedType: 'Double',       viewType: 'Lagon',  photos: [], amenities: JSON.stringify(['clim','tv','douche','wifi','balcon','vue_lagon']) } });
  const tFam  = await prisma.roomType.upsert({ where: { id: 'room-t-fam'  }, update: {}, create: { id: 'room-t-fam',  hotelId: telemaque.id, name: 'Suite Familiale',  description: '50m² — 2 chambres, jusqu\'à 4 pers.', capacity: 4, bedType: 'King+Twin',  viewType: 'Jardin', photos: [], amenities: JSON.stringify(['clim','tv','wifi','salon','2_chambres']) } });
  const cTel  = await prisma.contract.upsert({ where: { id: 'contract-telemaque-2026' }, update: {}, create: { id: 'contract-telemaque-2026', hotelId: telemaque.id, label: 'Saison 2026', seasonStart: new Date('2026-01-01'), seasonEnd: new Date('2026-12-31'), status: ContractStatus.ACTIVE, uploadedById: admin.id } });
  await seedRates(cTel.id, [
    { id: 'rt-std-bb', roomTypeId: tStd.id, mealPlan: MealPlan.BREAKFAST,    p1:169, p2:155, p3:145, commPct:8 },
    { id: 'rt-std-hb', roomTypeId: tStd.id, mealPlan: MealPlan.HALF_BOARD,   p1:209, p2:195, p3:185, commPct:8 },
    { id: 'rt-std-ai', roomTypeId: tStd.id, mealPlan: MealPlan.ALL_INCLUSIVE, p1:269, p2:249, p3:235, commPct:8 },
    { id: 'rt-sup-bb', roomTypeId: tSup.id, mealPlan: MealPlan.BREAKFAST,    p1:219, p2:199, p3:185, commPct:8 },
    { id: 'rt-sup-hb', roomTypeId: tSup.id, mealPlan: MealPlan.HALF_BOARD,   p1:259, p2:239, p3:225, commPct:8 },
    { id: 'rt-sup-ai', roomTypeId: tSup.id, mealPlan: MealPlan.ALL_INCLUSIVE, p1:319, p2:299, p3:279, commPct:8 },
    { id: 'rt-fam-hb', roomTypeId: tFam.id, mealPlan: MealPlan.HALF_BOARD,   p1:389, p2:369, p3:349, commPct:8 },
    { id: 'rt-fam-ai', roomTypeId: tFam.id, mealPlan: MealPlan.ALL_INCLUSIVE, p1:459, p2:439, p3:419, commPct:8 },
  ]);
  await seedAvailabilities([{ id: tStd.id, total: 15 }, { id: tSup.id, total: 8 }, { id: tFam.id, total: 5 }]);
  console.log('✅ Télémaque Beach & Spa Djerba');

  // ══════════════════════════════════════════════════════════════════════════
  // 4. ROYAL KARTHAGO DJERBA
  // ══════════════════════════════════════════════════════════════════════════
  const karthago = await prisma.hotel.upsert({ where: { id: 'hotel-royal-karthago-djerba' }, update: {}, create: {
    id: 'hotel-royal-karthago-djerba', name: 'Royal Karthago Djerba & Thalasso', stars: 5,
    city: 'Djerba', region: 'Sud', address: 'Zone Touristique, Djerba 4116',
    latitude: 33.8500, longitude: 10.9710,
    description: 'Palace 5★ sur la plage. 4 piscines, thalasso primé, 6 restaurants, kids club. Tout-inclus premium.',
    phone: '+21675757500', email: 'info@royalkarthago-djerba.tn',
    amenities: JSON.stringify(['4_piscines','thalasso','wifi','parking','6_restaurants','plage_privee','kids_club','tennis','casino']),
    photos: [], isActive: true, hotelierUserId: hKarthago.id,
  }});
  const kStd  = await prisma.roomType.upsert({ where: { id: 'room-k-std'  }, update: {}, create: { id: 'room-k-std',  hotelId: karthago.id, name: 'Classique',        description: '35m² — Décoration orientale, vue jardin', capacity: 2, bedType: 'Double/Twin', viewType: 'Jardin',      photos: [], amenities: JSON.stringify(['clim','tv_sat','minibar','coffre','bain_douche']) } });
  const kDlx  = await prisma.roomType.upsert({ where: { id: 'room-k-dlx'  }, update: {}, create: { id: 'room-k-dlx',  hotelId: karthago.id, name: 'Deluxe Sea View',  description: '38m² — Vue mer garantie, balcon',         capacity: 2, bedType: 'King',       viewType: 'Mer',         photos: [], amenities: JSON.stringify(['clim','tv_sat','minibar','coffre','balcon','vue_mer','peignoir']) } });
  const kSte  = await prisma.roomType.upsert({ where: { id: 'room-k-ste'  }, update: {}, create: { id: 'room-k-ste',  hotelId: karthago.id, name: 'Suite Royale',     description: '70m² — Salon, 2 balcons, panoramique',    capacity: 2, bedType: 'King',       viewType: 'Panoramique', photos: [], amenities: JSON.stringify(['clim','tv_sat','minibar','2_balcons','salon','jacuzzi','butler']) } });
  const cKart = await prisma.contract.upsert({ where: { id: 'contract-karthago-2026' }, update: {}, create: { id: 'contract-karthago-2026', hotelId: karthago.id, label: 'Saison 2026', seasonStart: new Date('2026-01-01'), seasonEnd: new Date('2026-12-31'), status: ContractStatus.ACTIVE, uploadedById: admin.id } });
  await seedRates(cKart.id, [
    { id: 'rk-std-bb', roomTypeId: kStd.id, mealPlan: MealPlan.BREAKFAST,    p1:249, p2:229, p3:209, commPct:10 },
    { id: 'rk-std-ai', roomTypeId: kStd.id, mealPlan: MealPlan.ALL_INCLUSIVE, p1:349, p2:329, p3:309, commPct:10 },
    { id: 'rk-dlx-bb', roomTypeId: kDlx.id, mealPlan: MealPlan.BREAKFAST,    p1:349, p2:329, p3:309, commPct:10 },
    { id: 'rk-dlx-ai', roomTypeId: kDlx.id, mealPlan: MealPlan.ALL_INCLUSIVE, p1:449, p2:429, p3:409, commPct:10 },
    { id: 'rk-ste-bb', roomTypeId: kSte.id, mealPlan: MealPlan.BREAKFAST,    p1:649, p2:619, p3:589, commPct:10 },
    { id: 'rk-ste-ai', roomTypeId: kSte.id, mealPlan: MealPlan.ALL_INCLUSIVE, p1:749, p2:719, p3:689, commPct:10 },
  ]);
  await seedAvailabilities([{ id: kStd.id, total: 10 }, { id: kDlx.id, total: 7 }, { id: kSte.id, total: 3 }]);
  console.log('✅ Royal Karthago Djerba');

  // ══════════════════════════════════════════════════════════════════════════
  // 5. ROYAL AZUR THALASSO HAMMAMET
  // ══════════════════════════════════════════════════════════════════════════
  const royalAzur = await prisma.hotel.upsert({ where: { id: 'hotel-royal-azur-hammamet' }, update: {}, create: {
    id: 'hotel-royal-azur-hammamet', name: 'Royal Azur Thalasso', stars: 5,
    city: 'Hammamet', region: 'Nord-Est', address: 'Zone Touristique Yasmine Hammamet',
    latitude: 36.3960, longitude: 10.5620,
    description: '5★ à Yasmine Hammamet — 4 piscines dont une chauffée, thalasso, plage privée 200m, 5 restaurants gastronomiques.',
    phone: '+21672242444', email: 'reservations@royalazur.tn',
    amenities: JSON.stringify(['4_piscines','thalasso','wifi','parking','5_restaurants','plage_200m','fitness','tennis','hammam','kids_club']),
    photos: [], isActive: true, hotelierUserId: hRoyalAzur.id,
  }});
  const raStd  = await prisma.roomType.upsert({ where: { id: 'room-ra-std'  }, update: {}, create: { id: 'room-ra-std',  hotelId: royalAzur.id, name: 'Standard Jardin',    description: '30m² — Terrasse, déco arabe',         capacity: 2, bedType: 'Double/Twin', viewType: 'Jardin', photos: [], amenities: JSON.stringify(['clim','tv','minibar','terrasse']) } });
  const raSup  = await prisma.roomType.upsert({ where: { id: 'room-ra-sup'  }, update: {}, create: { id: 'room-ra-sup',  hotelId: royalAzur.id, name: 'Supérieure Vue Mer', description: '34m² — Balcon face à la mer',          capacity: 2, bedType: 'King',       viewType: 'Mer',    photos: [], amenities: JSON.stringify(['clim','tv','minibar','balcon','vue_mer']) } });
  const raBng  = await prisma.roomType.upsert({ where: { id: 'room-ra-bng'  }, update: {}, create: { id: 'room-ra-bng',  hotelId: royalAzur.id, name: 'Bungalow Plage',     description: '45m² — Accès direct plage, douche ext.',capacity: 2, bedType: 'King',       viewType: 'Plage',  photos: [], amenities: JSON.stringify(['clim','tv','minibar','terrasse','acces_plage']) } });
  const raSte  = await prisma.roomType.upsert({ where: { id: 'room-ra-ste'  }, update: {}, create: { id: 'room-ra-ste',  hotelId: royalAzur.id, name: 'Suite Présidentielle',description: '90m² — 2 chambres, jacuzzi privé, butler', capacity: 4, bedType: 'King+Twin', viewType: 'Mer', photos: [], amenities: JSON.stringify(['clim','tv','minibar','jacuzzi_prive','butler','terrasse_privee']) } });
  const cAzur = await prisma.contract.upsert({ where: { id: 'contract-royalazur-2026' }, update: {}, create: { id: 'contract-royalazur-2026', hotelId: royalAzur.id, label: 'Saison 2026', seasonStart: new Date('2026-01-01'), seasonEnd: new Date('2026-12-31'), status: ContractStatus.ACTIVE, uploadedById: admin.id } });
  await seedRates(cAzur.id, [
    { id: 'ra-std-bb', roomTypeId: raStd.id, mealPlan: MealPlan.BREAKFAST,  p1:219, p2:199, p3:185, commPct:9 },
    { id: 'ra-std-hb', roomTypeId: raStd.id, mealPlan: MealPlan.HALF_BOARD, p1:259, p2:239, p3:225, commPct:9 },
    { id: 'ra-sup-bb', roomTypeId: raSup.id, mealPlan: MealPlan.BREAKFAST,  p1:299, p2:279, p3:259, commPct:9 },
    { id: 'ra-sup-hb', roomTypeId: raSup.id, mealPlan: MealPlan.HALF_BOARD, p1:339, p2:319, p3:299, commPct:9 },
    { id: 'ra-bng-bb', roomTypeId: raBng.id, mealPlan: MealPlan.BREAKFAST,  p1:379, p2:359, p3:339, commPct:9 },
    { id: 'ra-bng-hb', roomTypeId: raBng.id, mealPlan: MealPlan.HALF_BOARD, p1:419, p2:399, p3:379, commPct:9 },
    { id: 'ra-ste-bb', roomTypeId: raSte.id, mealPlan: MealPlan.BREAKFAST,  p1:799, p2:759, p3:729, commPct:9 },
    { id: 'ra-ste-hb', roomTypeId: raSte.id, mealPlan: MealPlan.HALF_BOARD, p1:849, p2:809, p3:779, commPct:9 },
  ]);
  await seedAvailabilities([{ id: raStd.id, total: 12 }, { id: raSup.id, total: 8 }, { id: raBng.id, total: 4 }, { id: raSte.id, total: 2 }]);
  console.log('✅ Royal Azur Thalasso Hammamet');

  // ══════════════════════════════════════════════════════════════════════════
  // 6. GOLDEN TULIP CARTHAGE TUNIS
  // ══════════════════════════════════════════════════════════════════════════
  const goldenTulip = await prisma.hotel.upsert({ where: { id: 'hotel-golden-tulip-carthage' }, update: {}, create: {
    id: 'hotel-golden-tulip-carthage', name: 'Golden Tulip Carthage Tunis', stars: 5,
    city: 'Tunis', region: 'Grand Tunis', address: 'Rue Ibn Chabat, Sidi Bou Said, Carthage 1073',
    latitude: 36.8529, longitude: 10.3280,
    description: '5★ à Carthage entre la mer et les ruines antiques. 180 chambres panoramiques, spa, bar rooftop et restaurant gastronomique.',
    phone: '+21671775000', email: 'reservations@goldentulip-carthage.tn',
    amenities: JSON.stringify(['piscine_chauffee','spa','wifi','parking_valet','restaurant_gastro','bar_rooftop','fitness','pressing','navette_aeroport']),
    photos: [], isActive: true, hotelierUserId: hGoldenTulip.id,
  }});
  const gStd  = await prisma.roomType.upsert({ where: { id: 'room-g-std'  }, update: {}, create: { id: 'room-g-std',  hotelId: goldenTulip.id, name: 'Classique',            description: '32m² — Vue ville ou mer',              capacity: 2, bedType: 'Double/Twin', viewType: 'Ville/Mer',   photos: [], amenities: JSON.stringify(['clim','tv_smart','minibar','coffre','bureau','nespresso']) } });
  const gDlx  = await prisma.roomType.upsert({ where: { id: 'room-g-dlx'  }, update: {}, create: { id: 'room-g-dlx',  hotelId: goldenTulip.id, name: 'Deluxe Vue Carthage', description: '36m² — Vue sur les ruines et la mer',  capacity: 2, bedType: 'King',       viewType: 'Carthage',    photos: [], amenities: JSON.stringify(['clim','tv_smart','minibar','coffre','vue_ruines','nespresso']) } });
  const gExc  = await prisma.roomType.upsert({ where: { id: 'room-g-exc'  }, update: {}, create: { id: 'room-g-exc',  hotelId: goldenTulip.id, name: 'Executive Lounge',    description: '40m² — Accès salon exécutif, pdéj incl.', capacity: 2, bedType: 'King',    viewType: 'Mer',         photos: [], amenities: JSON.stringify(['clim','tv_smart','minibar','acces_lounge','pdej_inclus','pressing']) } });
  const gSte  = await prisma.roomType.upsert({ where: { id: 'room-g-ste'  }, update: {}, create: { id: 'room-g-ste',  hotelId: goldenTulip.id, name: 'Suite Présidentielle', description: '80m² — Vue 360°, dining room, butler', capacity: 2, bedType: 'King',       viewType: 'Panoramique', photos: [], amenities: JSON.stringify(['clim','tv_smart','minibar','dining_room','butler','jacuzzi','vue_360']) } });
  const cGT   = await prisma.contract.upsert({ where: { id: 'contract-goldentulip-2026' }, update: {}, create: { id: 'contract-goldentulip-2026', hotelId: goldenTulip.id, label: 'Saison 2026', seasonStart: new Date('2026-01-01'), seasonEnd: new Date('2026-12-31'), status: ContractStatus.ACTIVE, uploadedById: admin.id } });
  await seedRates(cGT.id, [
    { id: 'rg-std-ro', roomTypeId: gStd.id, mealPlan: MealPlan.ROOM_ONLY,  p1:199, p2:185, p3:175, commPct:9 },
    { id: 'rg-std-bb', roomTypeId: gStd.id, mealPlan: MealPlan.BREAKFAST,  p1:229, p2:215, p3:199, commPct:9 },
    { id: 'rg-dlx-ro', roomTypeId: gDlx.id, mealPlan: MealPlan.ROOM_ONLY,  p1:279, p2:259, p3:245, commPct:9 },
    { id: 'rg-dlx-bb', roomTypeId: gDlx.id, mealPlan: MealPlan.BREAKFAST,  p1:309, p2:289, p3:269, commPct:9 },
    { id: 'rg-exc-bb', roomTypeId: gExc.id, mealPlan: MealPlan.BREAKFAST,  p1:379, p2:359, p3:339, commPct:9 },
    { id: 'rg-exc-hb', roomTypeId: gExc.id, mealPlan: MealPlan.HALF_BOARD, p1:419, p2:399, p3:379, commPct:9 },
    { id: 'rg-ste-bb', roomTypeId: gSte.id, mealPlan: MealPlan.BREAKFAST,  p1:699, p2:669, p3:639, commPct:9 },
    { id: 'rg-ste-hb', roomTypeId: gSte.id, mealPlan: MealPlan.HALF_BOARD, p1:749, p2:719, p3:689, commPct:9 },
  ]);
  await seedAvailabilities([{ id: gStd.id, total: 20 }, { id: gDlx.id, total: 12 }, { id: gExc.id, total: 8 }, { id: gSte.id, total: 3 }]);
  console.log('✅ Golden Tulip Carthage Tunis');

  // ── RÉSUMÉ ────────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed terminé !');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📧 Admin        : admin@tunisiatonight.com      / Admin@2026!');
  console.log('🏨 Barceló      : barcelo@tunisiatonight.com    / Hotelier@2026!');
  console.log('🏨 Hilton       : hilton@tunisiatonight.com     / Hotelier@2026!');
  console.log('🏨 Télémaque    : telemaque@tunisiatonight.com  / Hotelier@2026!');
  console.log('🏨 Karthago     : karthago@tunisiatonight.com   / Hotelier@2026!');
  console.log('🏨 Royal Azur   : royalazur@tunisiatonight.com  / Hotelier@2026!');
  console.log('🏨 GoldenTulip  : goldentulip@tunisiatonight.com / Hotelier@2026!');
  console.log('👤 Client       : sonia@test.tn                 / Client@2026!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏩 6 hôtels | 19 types de chambres | 90 jours dispo | tarifs 1n/2n/3n+');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
