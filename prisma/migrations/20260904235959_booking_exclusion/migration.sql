-- Prevents overlapping bookings at the database level. See BUILD_SPEC §6.2 / R10, R11.
-- Application-level checks lose the race; this cannot.
-- Run AFTER the initial Prisma migration — rename this folder to a later
-- timestamp than the init migration so it sorts second.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS period tstzrange
  GENERATED ALWAYS AS (tstzrange("startsAt", "endsAt", '[)')) STORED;

-- An instructor cannot be in two places at once.
ALTER TABLE "Booking"
  ADD CONSTRAINT booking_no_overlap_teacher
  EXCLUDE USING gist ("teacherId" WITH =, period WITH &&)
  WHERE (status IN ('CONFIRMED', 'COMPLETED'));

-- Neither can a student.
ALTER TABLE "Booking"
  ADD CONSTRAINT booking_no_overlap_student
  EXCLUDE USING gist ("studentId" WITH =, period WITH &&)
  WHERE (status IN ('CONFIRMED', 'COMPLETED'));

-- Violations surface as SQLSTATE 23P01 → the API returns 409 SLOT_TAKEN.
