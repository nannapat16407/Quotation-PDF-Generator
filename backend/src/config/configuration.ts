export default () => ({
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret',
    expiresIn: '7d',
  },
  googleDrive: {
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
  },
  app: {
    port: parseInt(process.env.PORT || '3001', 10),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
});
