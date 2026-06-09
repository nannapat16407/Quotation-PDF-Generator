-- DropIndex (implicit spool removal for status column)
-- Drop default and column from quotations
ALTER TABLE "quotations" DROP COLUMN "status";

-- Drop enum
DROP TYPE "QuotationStatus";

-- Change role column from enum to text
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE TEXT USING "role"::text;
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';

-- Drop enum
DROP TYPE "UserRole";
