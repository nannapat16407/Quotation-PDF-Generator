import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePackageDto {
  @ApiPropertyOptional({ example: 'Starter' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'สตาร์ทเตอร์' })
  @IsOptional()
  @IsString()
  nameTh?: string;

  @ApiPropertyOptional({ example: '1 Organization User' })
  @IsOptional()
  @IsString()
  userCountEn?: string;

  @ApiPropertyOptional({ example: 'ผู้ใช้องค์กร 1 ราย' })
  @IsOptional()
  @IsString()
  userCountTh?: string;

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
