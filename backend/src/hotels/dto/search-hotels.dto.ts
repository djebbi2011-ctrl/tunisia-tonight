import { IsString, IsOptional, IsInt, IsNumber, Min, Max, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { MealPlan } from '@prisma/client';

export class SearchHotelsDto {
  @ApiProperty({ example: 'Monastir' })
  @IsString()
  city: string;

  @ApiProperty({ example: '2026-07-18' })
  @IsDateString()
  checkin: string;

  @ApiProperty({ example: '2026-07-20' })
  @IsDateString()
  checkout: string;

  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  adults?: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  children?: number;

  @ApiProperty({ example: 4, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1) @Max(5)
  stars?: number;

  @ApiProperty({ example: 300, required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPriceTnd?: number;

  @ApiProperty({ enum: MealPlan, required: false })
  @IsOptional()
  @IsEnum(MealPlan)
  mealPlan?: MealPlan;

  @ApiProperty({ example: 'nuit', required: false, description: 'nuit | daypass' })
  @IsOptional()
  @IsString()
  type?: 'nuit' | 'daypass';
}
