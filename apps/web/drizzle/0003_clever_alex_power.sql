ALTER TABLE "repositories" ADD COLUMN "installation_id" text;--> statement-breakpoint
CREATE INDEX "repositories_installation_idx" ON "repositories" USING btree ("installation_id");