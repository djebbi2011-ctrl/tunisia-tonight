import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async getCalendar(hotelId: string, from: string, to: string) {
    const start = new Date(from);
    const end = new Date(to);
    return this.prisma.availability.findMany({
      where: {
        roomType: { hotelId },
        date: { gte: start, lte: end },
      },
      include: { roomType: { select: { id: true, name: true } } },
      orderBy: [{ roomTypeId: 'asc' }, { date: 'asc' }],
    });
  }

  async updateDay(dto: {
    roomTypeId: string;
    date: string;
    availableRooms?: number;
    isClosed?: boolean;
    overridePrice?: number;
  }) {
    return this.prisma.availability.upsert({
      where: { roomTypeId_date: { roomTypeId: dto.roomTypeId, date: new Date(dto.date) } },
      update: {
        availableRooms: dto.availableRooms,
        isClosed: dto.isClosed,
        overridePrice: dto.overridePrice,
      },
      create: {
        roomTypeId: dto.roomTypeId,
        date: new Date(dto.date),
        totalRooms: dto.availableRooms ?? 0,
        availableRooms: dto.availableRooms ?? 0,
        isClosed: dto.isClosed ?? false,
        overridePrice: dto.overridePrice,
      },
    });
  }

  async bulkUpdate(entries: {
    roomTypeId: string;
    date: string;
    availableRooms?: number;
    isClosed?: boolean;
    overridePrice?: number;
  }[]) {
    const results = await Promise.all(entries.map((e) => this.updateDay(e)));
    return { updated: results.length };
  }
}
