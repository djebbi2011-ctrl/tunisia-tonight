import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ContractStatus, ReservationStatus } from '@prisma/client';

@Injectable()
export class ReservationsService {
  constructor(private prisma: PrismaService) {}

  // ── RÉFÉRENCE UNIQUE ──────────────────────────────────────
  private async generateReference(): Promise<string> {
    const count = await this.prisma.reservation.count();
    return `TN-${String(count + 2800).padStart(4, '0')}`;
  }

  // ── CRÉER UNE RÉSERVATION ─────────────────────────────────
  async create(clientId: string, dto: CreateReservationDto) {
    const checkinDate = new Date(dto.checkin);
    const checkoutDate = new Date(dto.checkout);
    const nights = Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / 86400000);

    if (nights < 1) throw new BadRequestException('La date de départ doit être après la date d\'arrivée');

    // Trouver le tarif contrat actif
    const contractRate = await this.prisma.contractRate.findFirst({
      where: {
        roomTypeId: dto.roomTypeId,
        mealPlan: dto.mealPlan,
        isActive: true,
        contract: {
          hotelId: dto.hotelId,
          status: ContractStatus.ACTIVE,
          seasonStart: { lte: checkinDate },
          seasonEnd:   { gte: checkoutDate },
        },
      },
      orderBy: { basePriceTnd: 'asc' },
    });

    if (!contractRate) throw new NotFoundException('Aucun tarif disponible pour cette période');
    if (nights < contractRate.minStay) {
      throw new BadRequestException(`Durée minimum : ${contractRate.minStay} nuit(s)`);
    }

    // Vérifier disponibilités
    const availabilities = await this.prisma.availability.findMany({
      where: {
        roomTypeId: dto.roomTypeId,
        date: { gte: checkinDate, lt: checkoutDate },
        isClosed: false,
        availableRooms: { gt: 0 },
      },
    });
    if (availabilities.length < nights) {
      throw new BadRequestException('Chambre non disponible sur toutes les nuits demandées');
    }

    // Calculs financiers
    const contractPriceTnd = contractRate.basePriceTnd * nights;
    const commissionTnd = Math.round(contractPriceTnd * (contractRate.commissionPct / 100) * 100) / 100;
    const reference = await this.generateReference();

    // Créer la réservation
    const reservation = await this.prisma.reservation.create({
      data: {
        reference,
        clientId,
        hotelId: dto.hotelId,
        roomTypeId: dto.roomTypeId,
        contractRateId: contractRate.id,
        checkin: checkinDate,
        checkout: checkoutDate,
        nights,
        adults: dto.adults,
        children: dto.children || 0,
        childrenAges: dto.childrenAges || [],
        mealPlan: dto.mealPlan,
        specialRequests: dto.specialRequests,
        contractPriceTnd,
        commissionTnd,
        totalTnd: contractPriceTnd,
        status: ReservationStatus.PENDING_PAYMENT,
      },
      include: {
        hotel: { select: { name: true, city: true, address: true } },
        roomType: { select: { name: true, viewType: true } },
      },
    });

    return {
      reservation,
      paymentSummary: {
        commissionTnd,
        hotelBalanceTnd: contractPriceTnd - commissionTnd,
        totalContractTnd: contractPriceTnd,
        message: `Payez ${commissionTnd} TND de commission Tunisia Tonight. Le reste (${contractPriceTnd - commissionTnd} TND) sera réglé directement à l'hôtel.`,
      },
    };
  }

  // ── MES RÉSERVATIONS (CLIENT) ─────────────────────────────
  async findByClient(clientId: string) {
    return this.prisma.reservation.findMany({
      where: { clientId },
      include: {
        hotel: { select: { name: true, city: true, photos: true } },
        roomType: { select: { name: true, viewType: true } },
        payment: { select: { status: true, paidAt: true } },
        discount: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── DOSSIERS HÔTELIER ─────────────────────────────────────
  async findByHotel(hotelId: string, status?: ReservationStatus) {
    return this.prisma.reservation.findMany({
      where: { hotelId, ...(status ? { status } : {}) },
      include: {
        client: { select: { firstName: true, lastName: true, email: true, phone: true, cinPassport: true } },
        roomType: { select: { name: true } },
        discount: true,
        payment: { select: { status: true, amountTnd: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── DÉTAIL DOSSIER ────────────────────────────────────────
  async findOne(id: string) {
    const r = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        hotel: true,
        roomType: true,
        client: { select: { firstName: true, lastName: true, email: true, phone: true } },
        discount: true,
        payment: true,
      },
    });
    if (!r) throw new NotFoundException('Dossier introuvable');
    return r;
  }
}
