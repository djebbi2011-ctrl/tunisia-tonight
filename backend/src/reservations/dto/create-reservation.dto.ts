import { IsString, IsInt, IsOptional, IsDateString, IsEnum, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MealPlan } from '@prisma/client';

export class CreateReservationDto {
  @ApiProperty({ example: 'hotel-barcelo-monastir' })
  @IsString()
  hotelId: string;

  @ApiProperty({ example: 'room-barcelo-std' })
  @IsString()
  roomTypeId: string;

  @ApiProperty({ example: '2026-07-18' })
  @IsDateString()
  checkin: string;

  @ApiProperty({ example: '2026-07-20' })
  @IsDateString()
  checkout: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  adults: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  children?: number;

  @ApiProperty({ example: [], required: false })
  @IsOptional()
  @IsArray()
  childrenAges?: number[];

  @ApiProperty({ enum: MealPlan, example: MealPlan.BREAKFAST })
  @IsEnum(MealPlan)
  mealPlan: MealPlan;

  @ApiProperty({ example: 'Lit bébé souhaité', required: false })
  @IsOptional()
  @IsString()
  specialRequests?: string;
}
