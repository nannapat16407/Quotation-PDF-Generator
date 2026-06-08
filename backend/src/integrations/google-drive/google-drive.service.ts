import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export interface DriveFileResult {
  fileId: string;
  webViewLink: string;
  size: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 3000, 5000];

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private readonly folderId: string | undefined;
  private readonly enabled: boolean;
  private readonly oauth2Client: OAuth2Client;

  constructor(private configService: ConfigService) {
    const clientId = this.configService.get<string>('googleDrive.clientId');
    const clientSecret = this.configService.get<string>('googleDrive.clientSecret');
    const refreshToken = this.configService.get<string>('googleDrive.refreshToken');
    this.folderId = this.configService.get<string>('googleDrive.folderId');

    const hasCredentials = !!(
      clientId?.trim() &&
      clientSecret?.trim() &&
      refreshToken?.trim()
    );

    if (hasCredentials) {
      this.oauth2Client = new google.auth.OAuth2(clientId!.trim(), clientSecret!.trim());
      this.oauth2Client.setCredentials({ refresh_token: refreshToken!.trim() });
      this.enabled = true;
      this.logger.log('Google Drive OAuth2 configured');
      if (!this.folderId?.trim()) {
        this.logger.warn('GOOGLE_DRIVE_FOLDER_ID not set, files will upload to Drive root');
      }
    } else {
      this.oauth2Client = null as any;
      this.enabled = false;
      const missing: string[] = [];
      if (!clientId?.trim()) missing.push('GOOGLE_DRIVE_CLIENT_ID');
      if (!clientSecret?.trim()) missing.push('GOOGLE_DRIVE_CLIENT_SECRET');
      if (!refreshToken?.trim()) missing.push('GOOGLE_DRIVE_REFRESH_TOKEN');
      this.logger.warn(`Google Drive not configured. Missing: ${missing.join(', ')}`);
    }
  }

  private getDrive() {
    return google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  private async withRetry<T>(fn: () => Promise<T>, operation: string): Promise<T> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        const status = error?.response?.status;
        const message = error?.response?.data?.error?.message || error.message || 'Unknown error';

        if (status === 401 && attempt === 0) {
          this.logger.warn(`Auth error during ${operation}, refreshing token...`);
          try {
            await this.oauth2Client.getAccessToken();
            continue;
          } catch {
            throw new Error(`Google Drive auth refresh failed: ${message}`);
          }
        }

        const isRetryable = status === 403 || status === 429 || status === 500 || status === 503;
        if (!isRetryable || attempt === MAX_RETRIES) {
          this.logger.error(`Google Drive ${operation} failed: ${message}`);
          throw error;
        }

        const delay = RETRY_DELAYS[attempt];
        this.logger.warn(`Google Drive ${operation} failed (${status}), retrying in ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw new Error(`Google Drive ${operation} failed after ${MAX_RETRIES} retries`);
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

    const folderId = this.folderId?.trim();

    if (folderId) {
      const existingId = await this.findFileByName(fileName, folderId);
      if (existingId) {
        this.logger.log(`File exists → updating: ${fileName} (${existingId})`);
        const result = await this.updateFile(existingId, buffer, mimeType);
        this.logger.log(`File overwritten successfully: ${fileName}`);
        return result;
      }
    }

    return this.withRetry(async () => {
      const drive = this.getDrive();
      const response = await drive.files.create({
        requestBody: {
          name: fileName,
          parents: folderId ? [folderId] : undefined,
        },
        media: {
          mimeType,
          body: require('stream').Readable.from(buffer),
        },
        fields: 'id, webViewLink, size',
      });

      const file = response.data;
      this.logger.log(`File created new: ${fileName} (${file.id})`);

      return {
        fileId: file.id!,
        webViewLink: file.webViewLink!,
        size: file.size?.toString() || buffer.length.toString(),
      };
    }, 'upload');
  }

  private async findFileByName(fileName: string, folderId: string): Promise<string | null> {
    try {
      const drive = this.getDrive();
      const escapedName = fileName.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      const response = await drive.files.list({
        q: `name = '${escapedName}' and '${folderId}' in parents and trashed = false`,
        fields: 'files(id)',
        pageSize: 1,
      });
      return response.data.files?.[0]?.id ?? null;
    } catch (error: any) {
      this.logger.warn(`Failed to search for existing file: ${error.message}`);
      return null;
    }
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

    return this.withRetry(async () => {
      const drive = this.getDrive();
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
    }, 'update');
  }

  async deleteFile(fileId: string): Promise<void> {
    if (!this.enabled) {
      this.logger.warn('Google Drive not configured, skipping delete');
      return;
    }

    await this.withRetry(async () => {
      const drive = this.getDrive();
      await drive.files.delete({ fileId });
      this.logger.log(`Deleted file ${fileId} from Google Drive`);
    }, 'delete');
  }

  async validateFolder(folderId: string): Promise<{ valid: boolean; error?: string; folderName?: string }> {
    if (!this.enabled) {
      return { valid: false, error: 'Google Drive not configured' };
    }

    try {
      const drive = this.getDrive();
      const response = await drive.files.get({
        fileId: folderId,
        fields: 'id, name, mimeType',
      });

      const file = response.data;
      if (file.mimeType !== 'application/vnd.google-apps.folder') {
        return { valid: false, error: 'The specified ID is not a folder' };
      }

      return { valid: true, folderName: file.name ?? undefined };
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error.message || 'Unknown error';
      return { valid: false, error: message };
    }
  }

  async testConnection(): Promise<{ connected: boolean; error?: string }> {
    if (!this.enabled) {
      return { connected: false, error: 'Google Drive not configured' };
    }

    try {
      const drive = this.getDrive();
      const response = await drive.about.get({ fields: 'user' });
      const email = response.data.user?.emailAddress;
      this.logger.log(`Google Drive connection test successful: ${email}`);
      return { connected: true };
    } catch (error: any) {
      const message = error?.response?.data?.error?.message || error.message || 'Unknown error';
      return { connected: false, error: message };
    }
  }
}
