import { Controller, Get, Patch, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { Role, ReservationStatus } from '@prisma/client';
import { HotelierService, ValidateReservationDto } from './hotelier.service';

@ApiTags('Hotelier — Extranet')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.HOTELIER)
@Controller('hotelier')
export class HotelierController {
  constructor(private hotelierService: HotelierService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard hôtelier (arrivées, TO, CA)' })
  async getDashboard(@Request() req) {
    return this.hotelierService.getDashboard(req.user.id);
  }

  @Get('reservations')
  @ApiOperation({ summary: 'Liste dossiers clients' })
  async getReservations(@Request() req, @Query('status') status?: ReservationStatus) {
    return this.hotelierService.getReservations(req.user.id, status);
  }

  @Patch('reservations/:id/validate')
  @ApiOperation({ summary: 'Valider/refuser un dossier + appliquer remise (tracée admin)' })
  async validateReservation(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ValidateReservationDto,
  ) {
    return this.hotelierService.validateReservation(req.user.id, id, dto);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Calendrier disponibilités (temps réel)' })
  async getCalendar(
    @Request() req,
    @Query('startDate') startDate: string,
    @Query('days') days?: number,
  ) {
    return this.hotelierService.getCalendar(req.user.id, startDate, days);
  }

  @Put('availability/:roomTypeId/:date')
  @ApiOperation({ summary: 'Mettre à jour disponibilité / prix (temps réel)' })
  async updateAvailability(
    @Request() req,
    @Param('roomTypeId') roomTypeId: string,
    @Param('date') date: string,
    @Body() data: { availableRooms?: number; isClosed?: boolean; overridePrice?: number },
  ) {
    return this.hotelierService.updateAvailability(req.user.id, roomTypeId, date, data);
  }
}
