-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "model" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "serial_number" TEXT,
ADD COLUMN     "service_interval_months" INTEGER,
ADD COLUMN     "type" TEXT;
