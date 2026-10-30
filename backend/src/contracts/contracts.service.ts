import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractStatus } from '@prisma/client';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async findAll(hotelId?: string) {
    return this.prisma.contract.findMany({
      where: hotelId ? { hotelId } : undefined,
      include: {
        hotel: { select: { id: true, name: true, city: true } },
        rates: { include: { roomType: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        hotel: true,
        rates: { include: { roomType: true } },
      },
    });
    if (!contract) throw new NotFoundException('Contrat introuvable');
    return contract;
  }

  async create(dto: {
    hotelId: string;
    label: string;
    seasonStart: string;
    seasonEnd: string;
    fileUrl?: string;
  }) {
    return this.prisma.contract.create({
      data: {
        hotelId: dto.hotelId,
        label: dto.label,
        seasonStart: new Date(dto.seasonStart),
        seasonEnd: new Date(dto.seasonEnd),
        fileUrl: dto.fileUrl,
        status: ContractStatus.DRAFT,
      },
    });
  }

  async activate(id: string) {
    await this.findOne(id);
    return this.prisma.contract.update({
      where: { id },
      data: { status: ContractStatus.ACTIVE },
    });
  }

  async addRate(contractId: string, dto: {
    roomTypeId: string;
    mealPlan: string;
    basePriceTnd: number;
    commissionPct: number;
    minStay?: number;
  }) {
    await this.findOne(contractId);
    return this.prisma.contractRate.create({
      data: {
        contractId,
        roomTypeId: dto.roomTypeId,
        mealPlan: dto.mealPlan as any,
        basePriceTnd: dto.basePriceTnd,
        commissionPct: dto.commissionPct,
        minStay: dto.minStay ?? 1,
      },
    });
  }

  async uploadFile(id: string, fileUrl: string) {
    await this.findOne(id);
    return this.prisma.contract.update({
      where: { id },
      data: { fileUrl },
    });
  }
}
