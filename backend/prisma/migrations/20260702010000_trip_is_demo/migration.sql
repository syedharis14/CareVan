-- Scripted demo trips run the real pipeline but must be excluded from payouts/rollups.
ALTER TABLE "Trip" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
