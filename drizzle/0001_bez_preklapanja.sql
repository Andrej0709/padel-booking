-- Two bookings on the same court must never overlap in time.
-- This is the database's last line of defence against double bookings
-- (scenario "Dva klika u istoj sekundi" on the system map).
--
-- '[)' means start is included and end is excluded, so 19:00-20:30 and
-- 20:30-22:00 on the same court do not conflict.
-- Cancelled bookings do not hold the court.
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint
ALTER TABLE "rezervacije"
  ADD CONSTRAINT "rezervacije_bez_preklapanja"
  EXCLUDE USING gist (
    "teren_id" WITH =,
    tstzrange("pocetak", "kraj", '[)') WITH &&
  )
  WHERE ("status" <> 'otkazana');
