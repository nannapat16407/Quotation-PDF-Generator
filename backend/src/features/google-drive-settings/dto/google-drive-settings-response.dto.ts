import { ApiProperty } from '@nestjs/swagger';

export class GoogleDriveSettingsResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'https://drive.google.com/drive/folders/1abc...' })
  folderUrl: string;

  @ApiProperty({ example: '1abc...' })
  folderId: string;

  @ApiProperty()
  updatedAt: Date;
}
