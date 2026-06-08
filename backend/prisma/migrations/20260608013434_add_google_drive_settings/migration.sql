-- CreateTable
CREATE TABLE "google_drive_settings" (
    "id" TEXT NOT NULL,
    "folder_url" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "google_drive_settings_pkey" PRIMARY KEY ("id")
);
