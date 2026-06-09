import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PackageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  nameTh?: string;

  @ApiPropertyOptional()
  userCountEn?: string;

  @ApiPropertyOptional()
  userCountTh?: string;

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
