DROP INDEX "equipment_client_id_name_key";

CREATE INDEX "equipment_company_client_serial_idx" ON "equipment"("company_id", "client_id", "serial_number");
