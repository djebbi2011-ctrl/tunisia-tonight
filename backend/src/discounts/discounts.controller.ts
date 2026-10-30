import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('discounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('discounts')
export class DiscountsController {
  constructor(private prisma: PrismaService) {}

  @Get('log')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getLog() {
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
