import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationStatus } from '@prisma/client';

export interface ValidateReservationDto {
  action: 'validate' | 'refuse';
  discountPct?: number;
  discountTnd?: number;
  discountNotes?: string;
  refusedReason?: string;
}

@Injectable()
export class HotelierService {
  constructor(private prisma: PrismaService) {}

  // ── RÉCUPÉRER L'HÔTEL DE L'HÔTELIER ──────────────────────
  private async getHotelierHotelId(userId: string): Promise<string> {
    const hotel = await this.prisma.hotel.findUnique({ where: { hotelierUserId: userId } });
    if (!hotel) throw new ForbiddenException('Aucun hôtel associé à ce compte');
    return hotel.id;
  }

  // ── DASHBOARD ─────────────────────────────────────────────
  async getDashboard(userId: string) {
    const hotelId = await this.getHotelierHotelId(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [todayArrivals, todayDepartures, pending, monthRevenue] = await Promise.all([
      this.prisma.reservation.count({
        where: { hotelId, checkin: { gte: today, lt: tomorrow }, status: ReservationStatus.VALIDATED },
      }),
      this.prisma.reservation.count({
        where: { hotelId, checkout: { gte: today, lt: tomorrow }, status: ReservationStatus.VALIDATED },
      }),
      this.prisma.reservation.count({
        where: { hotelId, status: ReservationStatus.PAID },
      }),
      this.prisma.reservation.aggregate({
        where: {
          hotelId,
          status: ReservationStatus.VALIDATED,
          createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
        },
        _sum: { totalTnd: true },
      }),
    ]);

    return { hotelId, todayArrivals, todayDepartures, pendingValidation: pending, monthRevenueTnd: monthRevenue._sum.totalTnd || 0 };
  }

  // ── LISTE DOSSIERS ────────────────────────────────────────
  async getReservations(userId: string, status?: ReservationStatus) {
    const hotelId = await this.getHotelierHotelId(userId);
    return this.prisma.reservation.findMany({
      where: { hotelId, ...(status ? { status } : {}) },
      include: {
        client: { select: { firstName: true, lastName: true, email: true, phone: true, cinPassport: true } },
        roomType: { select: { name: true, viewType: true } },
        discount: true,
        payment: { select: { status: true, amountTnd: true, paidAt: true } },
      },
      orderBy: [{ status: 'asc' }, { checkin: 'asc' }],
    });
  }

  // ── VALIDER OU REFUSER UN DOSSIER ─────────────────────────
  async validateReservation(userId: string, reservationId: string, dto: ValidateReservationDto) {
    const hotelId = await this.getHotelierHotelId(userId);
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!reservation) throw new NotFoundException('Dossier introuvable');
    if (reservation.hotelId !== hotelId) throw new ForbiddenException('Dossier non autorisé');
    if (reservation.status !== ReservationStatus.PAID) {
      throw new BadRequestException('Ce dossier ne peut pas être validé (commission non encore payée)');
    }

    if (dto.action === 'refuse') {
      return this.prisma.reservation.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.REFUSED, refusedReason: dto.refusedReason },
      });
    }

    // === VALIDATION + REMISE ===
    const discountPct = dto.discountPct || 0;
    const contractTotal = reservation.contractPriceTnd;
    const discountAmount = dto.discountTnd || (contractTotal * discountPct / 100);
    const netPrice = contractTotal - discountAmount;
    const commissionImpact = reservation.commissionTnd; // commission reste sur tarif contrat

    // Enregistrer la remise dans le journal admin (VISIBLE ADMIN UNIQUEMENT)
    if (discountAmount > 0) {
      await this.prisma.discount.create({
        data: {
          reservationId,
          hotelierId: userId,
          discountPct,
          discountTnd: Math.round(discountAmount * 100) / 100,
          netPriceTnd: Math.round(netPrice * 100) / 100,
          commissionImpact: Math.round(commissionImpact * 100) / 100,
          notes: dto.discountNotes,
        },
      });
    }

    // Mettre à jour le statut
    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: ReservationStatus.VALIDATED,
        validatedAt: new Date(),
        validatedBy: userId,
      },
      include: { discount: true },
    });
  }

  // ── CALENDRIER DISPONIBILITÉS ─────────────────────────────
  async getCalendar(userId: string, startDate: string, days: number = 30) {
    const hotelId = await this.getHotelierHotelId(userId);
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + days);

    const roomTypes = await this.prisma.roomType.findMany({
      where: { hotelId, isActive: true },
      include: {
        availabilities: {
          where: { date: { gte: start, lt: end } },
          orderBy: { date: 'asc' },
        },
      },
    });

    return { hotelId, startDate, days, roomTypes };
  }

  // ── METTRE À JOUR DISPONIBILITÉ ───────────────────────────
  async updateAvailability(userId: string, roomTypeId: string, date: string, data: {
    availableRooms?: number;
    isClosed?: boolean;
    overridePrice?: number;
  }) {
    const hotelId = await this.getHotelierHotelId(userId);
    const roomType = await this.prisma.roomType.findFirst({ where: { id: roomTypeId, hotelId } });
    if (!roomType) throw new ForbiddenException('Type de chambre non autorisé');

    const dateObj = new Date(date);
    return this.prisma.availability.upsert({
      where: { roomTypeId_date: { roomTypeId, date: dateObj } },
      update: data,
      create: {
        roomTypeId,
        date: dateObj,
        totalRooms: data.availableRooms || 0,
        availableRooms: data.availableRooms || 0,
        isClosed: data.isClosed || false,
        overridePrice: data.overridePrice,
      },
    });
  }
}
