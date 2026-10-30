import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HotelsService } from './hotels.service';
import { SearchHotelsDto } from './dto/search-hotels.dto';

@ApiTags('Hotels')
@Controller('hotels')
export class HotelsController {
  constructor(private hotelsService: HotelsService) {}

  @Get('search')
  @ApiOperation({ summary: 'Rechercher des hôtels disponibles' })
  async search(@Query() dto: SearchHotelsDto) {
    return this.hotelsService.search(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Liste de tous les hôtels actifs' })
  async findAll(@Query('city') city?: string) {
    return this.hotelsService.findAll(city);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fiche hôtel complète' })
  async findOne(
    @Param('id') id: string,
    @Query('checkin') checkin?: string,
    @Query('checkout') checkout?: string,
  ) {
    return this.hotelsService.findOne(id, checkin, checkout);
  }
}
