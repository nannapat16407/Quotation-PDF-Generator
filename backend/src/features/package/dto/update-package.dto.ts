import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BillingType } from '../../../generated/prisma/client';

export class UpdatePackageDto {
  @ApiPropertyOptional({ example: 'Starter' })
  @IsOptional()
  @IsString()
  name?: string;

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

  @ApiPropertyOptional({ enum: BillingType })
  @IsOptional()
  @IsEnum(BillingType)
  billingType?: BillingType;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsNumber()
  monthlyPrice?: number;

  @ApiPropertyOptional({ example: 1500 })
  @IsOptional()
  @IsNumber()
  yearlyPrice?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
