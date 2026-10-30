import { Module } from '@nestjs/common';
import { HotelierController } from './hotelier.controller';
import { HotelierService } from './hotelier.service';

@Module({
  controllers: [HotelierController],
  providers: [HotelierService],
})
export class HotelierModule {}
