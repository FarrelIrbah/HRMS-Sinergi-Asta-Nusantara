-- ─── 2-Stage Leave Approval ──────────────────────────────────────────
-- Replace single PENDING with PENDING_MANAGER + PENDING_HR.
-- Split approver columns into manager-stage and HR-stage variants.
-- Existing APPROVED / REJECTED rows: preserve approver info into HR fields.
-- Existing PENDING rows: become PENDING_MANAGER (start at stage 1).

-- 1. Drop old FK so we can drop the column afterwards
ALTER TABLE "leave_requests" DROP CONSTRAINT "leave_requests_approvedById_fkey";

-- 2. Add new columns (nullable; populated below for historic rows)
ALTER TABLE "leave_requests"
  ADD COLUMN "managerApprovedById" TEXT,
  ADD COLUMN "managerNotes" TEXT,
  ADD COLUMN "managerApprovedAt" TIMESTAMP(3),
  ADD COLUMN "hrApprovedById" TEXT,
  ADD COLUMN "hrNotes" TEXT,
  ADD COLUMN "hrApprovedAt" TIMESTAMP(3);

-- 3. Migrate enum: drop default, swap type with USING (PENDING -> PENDING_MANAGER), reattach default
CREATE TYPE "LeaveStatus_new" AS ENUM (
  'PENDING_MANAGER',
  'PENDING_HR',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
);

ALTER TABLE "leave_requests" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "leave_requests"
  ALTER COLUMN "status" TYPE "LeaveStatus_new"
  USING (
    CASE "status"::text
      WHEN 'PENDING' THEN 'PENDING_MANAGER'::"LeaveStatus_new"
      ELSE "status"::text::"LeaveStatus_new"
    END
  );

DROP TYPE "LeaveStatus";
ALTER TYPE "LeaveStatus_new" RENAME TO "LeaveStatus";

ALTER TABLE "leave_requests"
  ALTER COLUMN "status" SET DEFAULT 'PENDING_MANAGER';

-- 4. Preserve historic approver info: HR was the de-facto approver in the old single-stage flow
UPDATE "leave_requests"
SET "hrApprovedById" = "approvedById",
    "hrNotes"        = "approverNotes",
    "hrApprovedAt"   = "approvedAt"
WHERE "status" IN ('APPROVED', 'REJECTED')
  AND "approvedById" IS NOT NULL;

-- 5. Drop old columns
ALTER TABLE "leave_requests"
  DROP COLUMN "approvedById",
  DROP COLUMN "approverNotes",
  DROP COLUMN "approvedAt";

-- 6. Add new FKs
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_managerApprovedById_fkey"
  FOREIGN KEY ("managerApprovedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_hrApprovedById_fkey"
  FOREIGN KEY ("hrApprovedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
