import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSupplierDto {
  @ApiProperty({ example: 'SuperHR Co., Ltd.' })
  @IsString()
  companyName: string;

  @ApiPropertyOptional({ example: 'บริษัท ซุปเปอร์เอชอาร์ จำกัด' })
  @IsOptional()
  @IsString()
  companyNameTh?: string;

  @ApiProperty({ example: '0105566158667' })
  @IsString()
  taxId: string;

  @ApiProperty({ example: '287 ชั้น 8 ถนนสีลม...' })
  @IsString()
  address: string;
}
