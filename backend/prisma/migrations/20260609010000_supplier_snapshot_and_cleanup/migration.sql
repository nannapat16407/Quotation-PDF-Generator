-- Drop columns from supplier_info
ALTER TABLE "supplier_info" DROP COLUMN "phone";
ALTER TABLE "supplier_info" DROP COLUMN "email";
ALTER TABLE "supplier_info" DROP COLUMN "website";

-- Add supplier snapshot to quotations for immutable PDF data
ALTER TABLE "quotations" ADD COLUMN "supplier_snapshot" JSONB;

-- Backfill existing quotations with current supplier data
UPDATE "quotations"
SET "supplier_snapshot" = (
  SELECT jsonb_build_object(
    'companyName', si."company_name",
    'companyNameTh', si."company_name_th",
    'taxId', si."tax_id",
    'address', si."address"
  )
  FROM "supplier_info" si
  LIMIT 1
)
WHERE "supplier_snapshot" IS NULL;
