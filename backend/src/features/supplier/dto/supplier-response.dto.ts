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

  @ApiProperty({ example: '02-077-7581' })
  phone: string;

  @ApiProperty({ example: 'cs@superhr.biz' })
  email: string;

  @ApiPropertyOptional({ example: 'www.superhr.biz' })
  website?: string;

  @ApiProperty()
  updatedAt: Date;
}
