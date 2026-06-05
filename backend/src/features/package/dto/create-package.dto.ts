import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingType } from '../../../generated/prisma/client';

export class CreatePackageDto {
  @ApiProperty({ example: 'Starter' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'สตาร์ทเตอร์' })
  @IsOptional()
  @IsString()
  nameTh?: string;

  @ApiPropertyOptional({ example: 'Basic HR management for small teams' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'ระบบบริหารงานบุคคลเบื้องต้นสำหรับทีมเล็ก' })
  @IsOptional()
  @IsString()
  descriptionTh?: string;

  @ApiProperty({ enum: BillingType, example: BillingType.MONTHLY })
  @IsEnum(BillingType)
  billingType: BillingType;

  @ApiProperty({ example: 150 })
  @IsNumber()
  monthlyPrice: number;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  yearlyPrice: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
