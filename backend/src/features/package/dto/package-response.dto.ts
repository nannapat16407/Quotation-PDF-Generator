import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingType } from '../../../generated/prisma/client';

export class PackageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  nameTh?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  descriptionTh?: string;

  @ApiProperty({ enum: BillingType })
  billingType: BillingType;

  @ApiProperty()
  monthlyPrice: number;

  @ApiProperty()
  yearlyPrice: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
