import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';

export interface DriveFileResult {
  fileId: string;
  webViewLink: string;
  size: string;
}

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private readonly folderId: string | undefined;
  private readonly enabled: boolean;

  constructor(private configService: ConfigService) {
    const clientId = this.configService.get<string>('googleDrive.clientId');
    const clientSecret = this.configService.get<string>('googleDrive.clientSecret');
    const refreshToken = this.configService.get<string>('googleDrive.refreshToken');
    this.folderId = this.configService.get<string>('googleDrive.folderId');
    this.enabled = !!(clientId && clientSecret && refreshToken);
  }

  private getAuth() {
    const clientId = this.configService.get<string>('googleDrive.clientId')!;
    const clientSecret = this.configService.get<string>('googleDrive.clientSecret')!;
    const refreshToken = this.configService.get<string>('googleDrive.refreshToken')!;

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return oauth2Client;
  }

  async uploadFile(
    fileName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<DriveFileResult> {
    if (!this.enabled) {
      this.logger.warn('Google Drive not configured, returning placeholder');
      return {
        fileId: `local-${Date.now()}`,
        webViewLink: `https://drive.google.com/placeholder/${fileName}`,
        size: buffer.length.toString(),
      };
    }

    const drive = google.drive({ version: 'v3', auth: this.getAuth() });

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: this.folderId ? [this.folderId] : undefined,
      },
      media: {
        mimeType,
        body: require('stream').Readable.from(buffer),
      },
      fields: 'id, webViewLink, size',
    });

    const file = response.data;
    this.logger.log(`Uploaded ${fileName} to Google Drive: ${file.id}`);

    return {
      fileId: file.id!,
      webViewLink: file.webViewLink!,
      size: file.size?.toString() || buffer.length.toString(),
    };
  }

  async updateFile(
    fileId: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<DriveFileResult> {
    if (!this.enabled) {
      this.logger.warn('Google Drive not configured, returning placeholder');
      return {
        fileId,
        webViewLink: `https://drive.google.com/placeholder/${fileId}`,
        size: buffer.length.toString(),
      };
    }

    const drive = google.drive({ version: 'v3', auth: this.getAuth() });

    const response = await drive.files.update({
      fileId,
      media: {
        mimeType,
        body: require('stream').Readable.from(buffer),
      },
      fields: 'id, webViewLink, size',
    });

    const file = response.data;
    this.logger.log(`Updated file ${fileId} on Google Drive`);

    return {
      fileId: file.id!,
      webViewLink: file.webViewLink!,
      size: file.size?.toString() || buffer.length.toString(),
    };
  }

  async deleteFile(fileId: string): Promise<void> {
    if (!this.enabled) {
      this.logger.warn('Google Drive not configured, skipping delete');
      return;
    }

    const drive = google.drive({ version: 'v3', auth: this.getAuth() });
    await drive.files.delete({ fileId });
    this.logger.log(`Deleted file ${fileId} from Google Drive`);
  }
}
