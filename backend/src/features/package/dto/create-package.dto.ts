import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePackageDto {
  @ApiProperty({ example: 'Starter' })
  @IsString()
  name: string;

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

  @ApiProperty({ example: 150 })
  @IsNumber()
  monthlyPrice: number;

  @ApiProperty({ example: 1500 })
  @IsNumber()
  yearlyPrice: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
