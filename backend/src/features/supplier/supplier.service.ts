import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  async get() {
    const records = await this.prisma.supplierInfo.findMany();
    if (records.length === 0) {
      return null;
    }
    return records[0];
  }

  async upsert(dto: UpdateSupplierDto) {
    const existing = await this.get();
    if (existing) {
      return this.prisma.supplierInfo.update({
        where: { id: existing.id },
        data: dto,
      });
    }
    return this.prisma.supplierInfo.create({
      data: dto,
    });
  }
}
