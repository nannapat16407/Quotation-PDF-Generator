-- AlterTable
ALTER TABLE "quotations" ADD COLUMN     "payment_term" TEXT NOT NULL DEFAULT '1 Month';
ALTER TABLE "quotations" ADD COLUMN     "due_date" TIMESTAMP WITH TIME ZONE;
