import { Controller, Post, Get, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { Roles } from '../common/guards/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role, ReservationStatus } from '@prisma/client';

@ApiTags('Reservations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('reservations')
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  @Post()
  @Roles(Role.CLIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Créer une réservation (client)' })
  async create(@Request() req, @Body() dto: CreateReservationDto) {
    return this.reservationsService.create(req.user.id, dto);
  }

  @Get('my')
  @Roles(Role.CLIENT)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Mes réservations (client)' })
  async myReservations(@Request() req) {
    return this.reservationsService.findByClient(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un dossier' })
  async findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }
}
