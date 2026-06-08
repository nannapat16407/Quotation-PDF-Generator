import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateGoogleDriveSettingsDto } from './dto/update-google-drive-settings.dto';

@Injectable()
export class GoogleDriveSettingsService {
  constructor(private prisma: PrismaService) {}

  async get() {
    const records = await this.prisma.googleDriveSettings.findMany();
    if (records.length === 0) {
      return null;
    }
    return records[0];
  }

  async upsert(dto: UpdateGoogleDriveSettingsDto) {
    const existing = await this.get();
    if (existing) {
      return this.prisma.googleDriveSettings.update({
        where: { id: existing.id },
        data: dto,
      });
    }
    return this.prisma.googleDriveSettings.create({
      data: dto,
    });
  }
}
