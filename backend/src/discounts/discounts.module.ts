import { Module } from '@nestjs/common';
import { DiscountsController } from './discounts.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DiscountsController],
})
export class DiscountsModule {}
