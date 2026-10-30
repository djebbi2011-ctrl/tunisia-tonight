import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchHotelsDto } from './dto/search-hotels.dto';
import { ContractStatus } from '@prisma/client';

@Injectable()
export class HotelsService {
  constructor(private prisma: PrismaService) {}

  // ── RECHERCHE PRINCIPALE ──────────────────────────────────
  async search(dto: SearchHotelsDto) {
    const { city, checkin, checkout, adults = 2, children = 0, stars, maxPriceTnd, mealPlan } = dto;

    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
    const nights = Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / 86400000);

    const hotels = await this.prisma.hotel.findMany({
      where: {
        isActive: true,
        city: { contains: city, mode: 'insensitive' },
        ...(stars ? { stars: { gte: stars } } : {}),
      },
      include: {
        roomTypes: {
          where: { isActive: true, capacity: { gte: adults } },
          include: {
            contractRates: {
              where: {
                isActive: true,
                ...(mealPlan ? { mealPlan } : {}),
                contract: {
                  status: ContractStatus.ACTIVE,
                  seasonStart: { lte: checkinDate },
                  seasonEnd:   { gte: checkoutDate },
                },
              },
              include: { contract: true },
              orderBy: { basePriceTnd: 'asc' },
              take: 1,
            },
            availabilities: {
              where: {
                date: { gte: checkinDate, lt: checkoutDate },
                isClosed: false,
                availableRooms: { gt: 0 },
              },
            },
          },
        },
      },
    });

    // Filtrer : hôtels ayant au moins 1 chambre disponible sur toutes les nuits
    const results = hotels
      .map((hotel) => {
        const availableRooms = hotel.roomTypes
          .filter((rt) => {
            if (!rt.contractRates.length) return false;
            if (rt.availabilities.length < nights) return false;
            return true;
          })
          .map((rt) => {
            const rate = rt.contractRates[0];
            const totalPrice = rate.basePriceTnd * nights;
            const commission = totalPrice * (rate.commissionPct / 100);
            return {
              roomTypeId: rt.id,
              name: rt.name,
              capacity: rt.capacity,
              bedType: rt.bedType,
              viewType: rt.viewType,
              photos: rt.photos,
              mealPlan: rate.mealPlan,
              basePriceTnd: rate.basePriceTnd,
              totalTnd: totalPrice,
              commissionTnd: Math.round(commission * 100) / 100,
              commissionPct: rate.commissionPct,
              minStay: rate.minStay,
            };
          })
          .filter((r) => !maxPriceTnd || r.basePriceTnd <= maxPriceTnd);

        if (!availableRooms.length) return null;

        const cheapest = availableRooms.sort((a, b) => a.basePriceTnd - b.basePriceTnd)[0];
        return {
          id: hotel.id,
          name: hotel.name,
          stars: hotel.stars,
          city: hotel.city,
          address: hotel.address,
          latitude: hotel.latitude,
          longitude: hotel.longitude,
          description: hotel.description,
          amenities: hotel.amenities,
          photos: hotel.photos.slice(0, 3),
          availableRooms,
          cheapestRate: cheapest,
          nights,
        };
      })
      .filter(Boolean);

    return { results, total: results.length, nights };
  }

  // ── FICHE HÔTEL ──────────────────────────────────────────
  async findOne(id: string, checkin?: string, checkout?: string) {
    const hotel = await this.prisma.hotel.findUnique({
      where: { id, isActive: true },
      include: {
        roomTypes: {
          where: { isActive: true },
          include: {
            contractRates: {
              where: {
                isActive: true,
                contract: { status: ContractStatus.ACTIVE },
              },
              include: { contract: { select: { label: true, seasonStart: true, seasonEnd: true } } },
            },
            availabilities: checkin && checkout ? {
              where: {
                date: { gte: new Date(checkin), lt: new Date(checkout) },
                isClosed: false,
              },
              orderBy: { date: 'asc' },
            } : undefined,
          },
        },
      },
    });

    if (!hotel) throw new NotFoundException('Hôtel introuvable');
    return hotel;
  }

  // ── LISTE PUBLIQUE ────────────────────────────────────────
  async findAll(city?: string) {
    return this.prisma.hotel.findMany({
      where: { isActive: true, ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}) },
      select: { id: true, name: true, stars: true, city: true, photos: true, description: true },
      orderBy: { stars: 'desc' },
    });
  }

  // ── ADMIN : GESTION HÔTELS ────────────────────────────────
  async create(data: any) {
    return this.prisma.hotel.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.hotel.update({ where: { id }, data });
  }

  async toggle(id: string) {
    const hotel = await this.prisma.hotel.findUnique({ where: { id } });
    if (!hotel) throw new NotFoundException();
    return this.prisma.hotel.update({ where: { id }, data: { isActive: !hotel.isActive } });
  }
}
