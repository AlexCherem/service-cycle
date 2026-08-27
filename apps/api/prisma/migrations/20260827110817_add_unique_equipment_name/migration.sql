/*
  Warnings:

  - A unique constraint covering the columns `[client_id,name]` on the table `equipment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "equipment_client_id_name_key" ON "equipment"("client_id", "name");
