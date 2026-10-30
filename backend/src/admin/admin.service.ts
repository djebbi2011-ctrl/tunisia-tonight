import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReservationStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [
      reservations,
      pendingValidations,
      activeHotels,
      discounts,
      commissionSum,
    ] = await Promise.all([
      this.prisma.reservation.count(),
      this.prisma.reservation.count({ where: { status: ReservationStatus.PAID } }),
      this.prisma.hotel.count(),
      this.prisma.discount.aggregate({ _count: { id: true }, _sum: { commissionImpact: true } }),
      this.prisma.reservation.aggregate({
        _sum: { commissionTnd: true },
        where: { status: { in: [ReservationStatus.VALIDATED, ReservationStatus.COMPLETED] } },
      }),
    ]);

    return {
      reservations,
      pendingValidations,
      activeHotels,
      discountCount: discounts._count.id,
      totalDiscountTnd: discounts._sum.commissionImpact ?? 0,
      revenue: commissionSum._sum.commissionTnd ?? 0,
    };
  }

  async getHotels() {
    return this.prisma.hotel.findMany({
      include: {
        hotelier: { select: { firstName: true, lastName: true, email: true } },
        _count: { select: { reservations: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getReservations(status?: string) {
    return this.prisma.reservation.findMany({
      where: status && status !== 'ALL' ? { status: status as ReservationStatus } : undefined,
      include: {
        hotel: { select: { name: true, city: true } },
        client: { select: { firstName: true, lastName: true, email: true } },
        discount: { select: { discountTnd: true, discountPct: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getDiscountsLog() {
    return this.prisma.discount.findMany({
      include: {
        reservation: {
          select: {
            reference: true,
            contractPriceTnd: true,
            commissionTnd: true,
            checkin: true,
            checkout: true,
            hotel: { select: { name: true, city: true } },
            client: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        hotelier: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
