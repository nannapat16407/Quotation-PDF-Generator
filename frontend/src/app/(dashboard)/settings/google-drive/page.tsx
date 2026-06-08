'use client';

import { useState, useEffect } from 'react';
import { useGoogleDriveSettings } from '@/hooks/use-google-drive-settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ALLOWED_TYPES = ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PNG', 'JPG', 'JPEG'];
const MAX_SIZE_MB = 10;

function extractFolderId(input: string): string {
  const match = input.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return input.trim();
}

export default function GoogleDrivePage() {
  const {
    settings,
    isLoading,
    update,
    isUpdating,
    validate,
    isValidating,
    validationResult,
    testConnection,
    isTestingConnection,
    connectionResult,
  } = useGoogleDriveSettings();

  const [folderUrl, setFolderUrl] = useState('');

  useEffect(() => {
    if (settings) {
      setFolderUrl(settings.folderUrl || '');
    }
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const folderId = extractFolderId(folderUrl);
    await update({ folderUrl, folderId });
  };

  const handleTestConnection = async () => {
    await testConnection();
  };

  const handleValidateFolder = async () => {
    await validate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Google Drive Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure the Google Drive folder for storing quotation PDFs and attachments.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
          <CardDescription>
              Verify that Google Drive is configured and the API is accessible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </Button>
            {connectionResult && (
              <Badge variant={connectionResult.connected ? 'default' : 'destructive'}>
                {connectionResult.connected
                  ? 'Connected'
                  : connectionResult.error || 'Failed'}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Destination Folder</CardTitle>
          <CardDescription>
            Enter the Google Drive folder URL or ID where files will be uploaded.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folderUrl">Folder URL or ID</Label>
              <Input
                id="folderUrl"
                value={folderUrl}
                onChange={(e) => setFolderUrl(e.target.value)}
                required
                placeholder="https://drive.google.com/drive/folders/..."
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleValidateFolder}
                disabled={isValidating || !folderUrl}
              >
                {isValidating ? 'Validating...' : 'Validate Folder'}
              </Button>
              {validationResult && (
                <Badge variant={validationResult.valid ? 'default' : 'destructive'}>
                  {validationResult.valid
                    ? `Valid: ${validationResult.folderName}`
                    : validationResult.error || 'Invalid'}
                </Badge>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Constraints</CardTitle>
          <CardDescription>
            File types and size limits enforced for uploads.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">Allowed File Types</p>
            <div className="flex flex-wrap gap-2">
              {ALLOWED_TYPES.map((type) => (
                <Badge key={type} variant="secondary">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium">Maximum File Size</p>
            <p className="text-sm text-muted-foreground">{MAX_SIZE_MB} MB</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
