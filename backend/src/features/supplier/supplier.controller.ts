import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SupplierService } from './supplier.service';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@ApiTags('Supplier Settings')
@Controller('supplier')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('ADMIN')
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Get()
  @ApiOperation({ summary: 'Get supplier info' })
  get() {
    return this.supplierService.get();
  }

  @Put()
  @ApiOperation({ summary: 'Update supplier info' })
  upsert(@Body() dto: UpdateSupplierDto) {
    return this.supplierService.upsert(dto);
  }
}
