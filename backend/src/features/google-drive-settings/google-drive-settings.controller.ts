import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GoogleDriveSettingsService } from './google-drive-settings.service';
import { UpdateGoogleDriveSettingsDto } from './dto/update-google-drive-settings.dto';
import { GoogleDriveService } from '../../integrations/google-drive/google-drive.service';

@ApiTags('Google Drive Settings')
@Controller('google-drive-settings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GoogleDriveSettingsController {
  constructor(
    private readonly settingsService: GoogleDriveSettingsService,
    private readonly driveService: GoogleDriveService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get Google Drive settings' })
  get() {
    return this.settingsService.get();
  }

  @Put()
  @ApiOperation({ summary: 'Update Google Drive settings' })
  upsert(@Body() dto: UpdateGoogleDriveSettingsDto) {
    return this.settingsService.upsert(dto);
  }

  @Get('validate-folder')
  @ApiOperation({ summary: 'Validate a Google Drive folder ID' })
  async validateFolder() {
    const settings = await this.settingsService.get();
    if (!settings) {
      return { valid: false, error: 'No Google Drive folder configured' };
    }
    return this.driveService.validateFolder(settings.folderId);
  }

  @Get('test-connection')
  @ApiOperation({ summary: 'Test Google Drive connection with current settings' })
  async testConnection() {
    return this.driveService.testConnection();
  }
}
