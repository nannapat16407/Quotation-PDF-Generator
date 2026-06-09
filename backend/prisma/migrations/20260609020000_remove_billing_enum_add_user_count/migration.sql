-- Add contact_info to supplier_info
ALTER TABLE "supplier_info" ADD COLUMN "contact_info" TEXT NOT NULL DEFAULT 'Super HR Co., Ltd. | 287 Silom Rd, Silom, Bang Rak, Bangkok 10500 | cs@superhr.biz | www.superhr.biz | 02-077-7581';

-- Add user_count fields to packages
ALTER TABLE "packages" ADD COLUMN "user_count_en" TEXT;
ALTER TABLE "packages" ADD COLUMN "user_count_th" TEXT;

-- Drop billing_type enum from packages
ALTER TABLE "packages" DROP COLUMN "billing_type";

-- Drop description columns from packages
ALTER TABLE "packages" DROP COLUMN "description";
ALTER TABLE "packages" DROP COLUMN "description_th";

-- Convert quotations.billing_type from enum to text
ALTER TABLE "quotations" ALTER COLUMN "billing_type" DROP DEFAULT;
ALTER TABLE "quotations" ALTER COLUMN "billing_type" TYPE TEXT USING "billing_type"::text;
ALTER TABLE "quotations" ALTER COLUMN "billing_type" SET DEFAULT 'MONTHLY';

-- Drop the BillingType enum
DROP TYPE "BillingType";

-- Backfill user_count from existing package data
UPDATE "packages" SET "user_count_en" = '1 Organization User', "user_count_th" = 'ผู้ใช้องค์กร 1 ราย' WHERE "name" = 'Starter';
UPDATE "packages" SET "user_count_en" = '2 Organization Users', "user_count_th" = 'ผู้ใช้องค์กร 2 ราย' WHERE "name" = 'Basic Account';
UPDATE "packages" SET "user_count_en" = '3 Organization Users', "user_count_th" = 'ผู้ใช้องค์กร 3 ราย' WHERE "name" = 'Advanced';
UPDATE "packages" SET "user_count_en" = 'Unlimited Users', "user_count_th" = 'ผู้ใช้ไม่จำกัด' WHERE "name" = 'Go Pro';

-- Update existing supplier snapshots to include contactInfo
UPDATE "quotations"
SET "supplier_snapshot" = (
  SELECT jsonb_set(
    COALESCE("supplier_snapshot", '{}'::jsonb),
    '{contactInfo}',
    to_jsonb(si."contact_info")
  )
  FROM "supplier_info" si
  LIMIT 1
)
WHERE "supplier_snapshot" IS NOT NULL
  AND NOT ("supplier_snapshot" ? 'contactInfo');
