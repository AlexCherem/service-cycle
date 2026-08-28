/*
  Warnings:

  - A unique constraint covering the columns `[company_id,phone]` on the table `clients` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "clients_company_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "clients_company_id_phone_key" ON "clients"("company_id", "phone");
