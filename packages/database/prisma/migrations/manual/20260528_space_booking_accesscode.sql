-- Batch 3 (Spaces operations): time-limited entry codes.
-- Adds a 6-digit access code to SpaceBooking. The renter UI gates visibility
-- to the booking window; the column itself is just a nullable string. Safe
-- to run repeatedly.

ALTER TABLE "SpaceBooking" ADD COLUMN IF NOT EXISTS "accessCode" TEXT;
