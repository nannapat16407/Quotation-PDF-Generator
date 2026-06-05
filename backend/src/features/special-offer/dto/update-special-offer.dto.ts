import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSpecialOfferDto {
  @ApiPropertyOptional({ example: 'Free Data Migration' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'นำเข้าข้อมูลฟรี' })
  @IsOptional()
  @IsString()
  nameTh?: string;

  @ApiPropertyOptional({ example: 'Free for Basic plans and above.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'ฟรีสำหรับแพ็กเกจ Basic ขึ้นไป' })
  @IsOptional()
  @IsString()
  descriptionTh?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
