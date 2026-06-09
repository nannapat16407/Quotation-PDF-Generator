import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateQuotationItemDto {
  @ApiProperty({ enum: ['PACKAGE', 'ADDON'] })
  @IsEnum(['PACKAGE', 'ADDON'])
  type: 'PACKAGE' | 'ADDON';

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionTh?: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  qty: number;

  @ApiProperty({ example: 459 })
  @IsNumber()
  unitPrice: number;

  @ApiProperty({ example: 459 })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class CreateQuotationOfferDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialOfferId?: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nameTh?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isCustom?: boolean;
}

export class CreateQuotationDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  customerCompany: string;

  @ApiPropertyOptional({ example: 'บริษัท แอคมี จำกัด' })
  @IsOptional()
  @IsString()
  customerCompanyTh?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerTaxId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiProperty()
  @IsDateString()
  issuedDate: string;

  @ApiProperty()
  @IsDateString()
  validUntil: string;

  @ApiProperty()
  @IsString()
  packageId: string;

  @ApiProperty({ example: 'MONTHLY' })
  @IsEnum(['MONTHLY', 'YEARLY'])
  billingType: 'MONTHLY' | 'YEARLY';

  @ApiProperty({ example: 459 })
  @IsNumber()
  packageAmount: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  addonsAmount: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  discount: number;

  @ApiProperty({ example: 459 })
  @IsNumber()
  subtotal: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  vatEnabled?: boolean;

  @ApiProperty({ example: 0 })
  @IsNumber()
  vatAmount: number;

  @ApiProperty({ example: 459 })
  @IsNumber()
  totalAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signatureUrl?: string;

  @ApiProperty({ type: [CreateQuotationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationItemDto)
  items: CreateQuotationItemDto[];

  @ApiPropertyOptional({ type: [CreateQuotationOfferDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotationOfferDto)
  offers?: CreateQuotationOfferDto[];
}
