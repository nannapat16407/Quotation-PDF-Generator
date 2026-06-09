import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PackageService } from './package.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@ApiTags('Packages')
@Controller('packages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PackageController {
  constructor(private readonly packageService: PackageService) {}

  @Get()
  @ApiOperation({ summary: 'List all packages' })
  findAll() {
    return this.packageService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get package by ID' })
  findOne(@Param('id') id: string) {
    return this.packageService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new package' })
  create(@Body() dto: CreatePackageDto) {
    return this.packageService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a package' })
  update(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packageService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a package' })
  remove(@Param('id') id: string) {
    return this.packageService.remove(id);
  }
}
