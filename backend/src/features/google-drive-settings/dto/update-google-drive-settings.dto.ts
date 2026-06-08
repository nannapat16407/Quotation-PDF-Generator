import { IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGoogleDriveSettingsDto {
  @ApiProperty({ example: 'https://drive.google.com/drive/folders/1abc...' })
  @IsUrl()
  folderUrl: string;

  @ApiProperty({ example: '1abc...' })
  @IsString()
  folderId: string;
}
