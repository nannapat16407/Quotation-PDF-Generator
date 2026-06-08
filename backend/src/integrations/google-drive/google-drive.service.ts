import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

export interface DriveFileResult {
  fileId: string;
  webViewLink: string;
  size: string;
}

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private readonly folderId: string | undefined;
  private readonly enabled: boolean;
  private readonly authClient: JWT | null = null;

  constructor(private configService: ConfigService) {
    this.folderId = this.configService.get<string>('googleDrive.folderId');
    const credentialsPath = this.configService.get<string>('googleDrive.credentialsPath');

    if (!credentialsPath) {
      this.enabled = false;
      this.logger.warn('GOOGLE_APPLICATION_CREDENTIALS not set, Google Drive disabled');
      return;
    }

    const resolvedPath = path.resolve(credentialsPath);
    if (!fs.existsSync(resolvedPath)) {
      this.enabled = false;
      this.logger.error(`Service Account file not found: ${resolvedPath}`);
      return;
    }

    try {
      const raw = fs.readFileSync(resolvedPath, 'utf-8');
      const credentials: ServiceAccountCredentials = JSON.parse(raw);

      if (!credentials.client_email || !credentials.private_key) {
        this.enabled = false;
        this.logger.error('Service Account JSON missing client_email or private_key');
        return;
      }

      this.authClient = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/drive'],
      });

      this.enabled = true;
      this.logger.log(`Service Account loaded: ${credentials.client_email}`);
    } catch (err) {
      this.enabled = false;
      this.logger.error(`Failed to load Service Account: ${(err as Error).message}`);
    }
  }

  private getAuth(): JWT {
    return this.authClient!;
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
      supportsAllDrives: true,
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
      supportsAllDrives: true,
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
    await drive.files.delete({ fileId, supportsAllDrives: true });
    this.logger.log(`Deleted file ${fileId} from Google Drive`);
  }

  async validateFolder(folderId: string): Promise<{ valid: boolean; error?: string; folderName?: string }> {
    if (!this.enabled) {
      return { valid: false, error: 'Google Drive Service Account not configured' };
    }

    try {
      const drive = google.drive({ version: 'v3', auth: this.getAuth() });
      const response = await drive.files.get({
        fileId: folderId,
        supportsAllDrives: true,
        fields: 'id, name, mimeType, driveId',
      });

      const file = response.data;
      if (file.mimeType !== 'application/vnd.google-apps.folder') {
        return { valid: false, error: 'The specified ID is not a folder' };
      }

      if (!file.driveId) {
        return {
          valid: false,
          error: 'This folder is in a personal My Drive. Service Accounts cannot upload to My Drive folders (no storage quota). Move this folder into a Shared Drive and try again.',
          folderName: file.name ?? undefined,
        };
      }

      return { valid: true, folderName: file.name ?? undefined };
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error.message || 'Unknown error';
      return { valid: false, error: message };
    }
  }

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    if (!this.enabled) {
      return { connected: false, error: 'Google Drive Service Account not configured' };
    }

    try {
      const drive = google.drive({ version: 'v3', auth: this.getAuth() });
      await drive.about.get({ fields: 'user' });
      return { connected: true };
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error.message || 'Unknown error';
      return { connected: false, error: message };
    }
  }
}
