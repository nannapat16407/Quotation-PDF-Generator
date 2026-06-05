import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSpecialOfferDto } from './dto/create-special-offer.dto';
import { UpdateSpecialOfferDto } from './dto/update-special-offer.dto';

@Injectable()
export class SpecialOfferService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.specialOffer.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: string) {
    const offer = await this.prisma.specialOffer.findUnique({ where: { id } });
    if (!offer) {
      throw new NotFoundException(`Special offer ${id} not found`);
    }
    return offer;
  }

  async create(dto: CreateSpecialOfferDto) {
    return this.prisma.specialOffer.create({
      data: {
        name: dto.name,
        nameTh: dto.nameTh,
        description: dto.description,
        descriptionTh: dto.descriptionTh,
        isActive: dto.isActive ?? true,
        isDefault: dto.isDefault ?? false,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, dto: UpdateSpecialOfferDto) {
    await this.findOne(id);
    return this.prisma.specialOffer.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.specialOffer.delete({ where: { id } });
  }
}
