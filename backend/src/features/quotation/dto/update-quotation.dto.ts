import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
  Matches,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  CreateQuotationItemDto,
  CreateQuotationOfferDto,
} from './create-quotation.dto';

export class UpdateQuotationDto {
  @ApiPropertyOptional({ example: 'QUO202606001' })
  @IsOptional()
  @IsString()
  quotationNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerCompany?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerCompanyTh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^\d{13}$/, { message: 'Tax ID must be exactly 13 digits' })
  customerTaxId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  issuedDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ example: '1 Month' })
  @IsOptional()
  @IsString()
  paymentTerm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  packageId?: string;

  @ApiPropertyOptional({ example: 'MONTHLY' })
  @IsOptional()
  @IsEnum(['MONTHLY', 'YEARLY'])
  billingType?: 'MONTHLY' | 'YEARLY';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  packageAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  addonsAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  vatEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  vatAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signatureUrl?: string;

  @ApiPropertyOptional({ type: [CreateQuotationItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items?: CreateQuotationItemDto[];

  @ApiPropertyOptional({ type: [CreateQuotationOfferDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationOfferDto)
  offers?: CreateQuotationOfferDto[];
}
