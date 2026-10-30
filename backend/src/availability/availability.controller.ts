import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { AvailabilityService } from './availability.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('availability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('availability')
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN', 'HOTELIER')
  getCalendar(
    @Query('hotelId') hotelId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.availabilityService.getCalendar(hotelId, from, to);
  }

  @Post('update')
  @Roles('ADMIN', 'SUPER_ADMIN', 'HOTELIER')
  updateDay(@Body() dto: any) {
    return this.availabilityService.updateDay(dto);
  }

  @Post('bulk')
  @Roles('ADMIN', 'SUPER_ADMIN', 'HOTELIER')
  bulkUpdate(@Body() body: { entries: any[] }) {
    return this.availabilityService.bulkUpdate(body.entries);
  }
}
