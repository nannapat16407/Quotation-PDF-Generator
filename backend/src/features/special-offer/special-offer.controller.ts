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
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { SpecialOfferService } from './special-offer.service';
import { CreateSpecialOfferDto } from './dto/create-special-offer.dto';
import { UpdateSpecialOfferDto } from './dto/update-special-offer.dto';

@ApiTags('Special Offers')
@Controller('special-offers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SpecialOfferController {
  constructor(private readonly offerService: SpecialOfferService) {}

  @Get()
  @ApiOperation({ summary: 'List all special offers' })
  findAll() {
    return this.offerService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get special offer by ID' })
  findOne(@Param('id') id: string) {
    return this.offerService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new special offer' })
  create(@Body() dto: CreateSpecialOfferDto) {
    return this.offerService.create(dto);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a special offer' })
  update(@Param('id') id: string, @Body() dto: UpdateSpecialOfferDto) {
    return this.offerService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a special offer' })
  remove(@Param('id') id: string) {
    return this.offerService.remove(id);
  }
}
