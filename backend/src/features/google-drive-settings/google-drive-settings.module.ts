import { Module } from '@nestjs/common';
import { GoogleDriveSettingsController } from './google-drive-settings.controller';
import { GoogleDriveSettingsService } from './google-drive-settings.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { GoogleDriveModule } from '../../integrations/google-drive/google-drive.module';

@Module({
  imports: [PrismaModule, GoogleDriveModule],
  controllers: [GoogleDriveSettingsController],
  providers: [GoogleDriveSettingsService],
  exports: [GoogleDriveSettingsService],
})
export class GoogleDriveSettingsModule {}
