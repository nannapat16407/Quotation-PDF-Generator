import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupplierResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'SuperHR Co., Ltd.' })
  companyName: string;

  @ApiPropertyOptional({ example: 'บริษัท ซุปเปอร์เอชอาร์ จำกัด' })
  companyNameTh?: string;

  @ApiProperty({ example: '0105566158667' })
  taxId: string;

  @ApiProperty({ example: '287 ชั้น 8 ถนนสีลม...' })
  address: string;

  @ApiProperty({ example: 'Super HR Co., Ltd. | 287 Silom Rd...' })
  contactInfo: string;

  @ApiProperty()
  updatedAt: Date;
}
