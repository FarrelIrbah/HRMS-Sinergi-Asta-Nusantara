-- DropForeignKey
ALTER TABLE "employee_allowances" DROP CONSTRAINT "employee_allowances_employeeId_fkey";

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "baseSalary";

-- AlterTable
ALTER TABLE "leave_requests" DROP COLUMN "attachmentName",
DROP COLUMN "attachmentPath";

-- AlterTable
ALTER TABLE "payroll_entries" DROP COLUMN "absenceDeduction",
DROP COLUMN "baseSalary",
DROP COLUMN "bpjsJhtEmp",
DROP COLUMN "bpjsJhtEmpr",
DROP COLUMN "bpjsJkk",
DROP COLUMN "bpjsJkm",
DROP COLUMN "bpjsJpEmp",
DROP COLUMN "bpjsJpEmpr",
DROP COLUMN "bpjsKesEmp",
DROP COLUMN "bpjsKesEmpr",
DROP COLUMN "grossPay",
DROP COLUMN "netPay",
DROP COLUMN "overtimePay",
DROP COLUMN "thrAmount",
DROP COLUMN "totalAllowances",
ADD COLUMN     "actualWorkingDay" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "attendanceCodes" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "basicSalary" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "bpjsKesehatanCompany" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "bpjsKesehatanEmployee" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "companyHoliday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dayoff" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "gradeLevel" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "jaminanPensiunCompany" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "jaminanPensiunEmployee" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "jhtCompany" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "jhtEmployee" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "jkk" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "jkm" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "jobPosition" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "nationalHoliday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "npwp" TEXT,
ADD COLUMN     "organization" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "potonganKeterlambatan" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "potonganKoperasi" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "potonganLainnya" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "ptkpStatus" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "scheduleWorkingDay" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "specialHoliday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "takeHomePay" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "taxAllowance" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "thr" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalBenefits" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "totalEarnings" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "tunjanganJabatan" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tunjanganKehadiran" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tunjanganKomunikasi" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tunjanganLainnya" DECIMAL(15,2) NOT NULL DEFAULT 0,
ALTER COLUMN "pph21" SET DEFAULT 0;

-- DropTable
DROP TABLE "employee_allowances";
