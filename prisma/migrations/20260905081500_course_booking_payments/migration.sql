ALTER TYPE "BookingStatus" ADD VALUE 'PENDING_PAYMENT' BEFORE 'COMPLETED';

ALTER TABLE "CourseBooking"
  ADD COLUMN "sourceOrderItemId" TEXT;

CREATE INDEX "CourseBooking_sourceOrderItemId_idx"
  ON "CourseBooking"("sourceOrderItemId");

ALTER TABLE "CourseBooking"
  ADD CONSTRAINT "CourseBooking_sourceOrderItemId_fkey"
  FOREIGN KEY ("sourceOrderItemId") REFERENCES "OrderItem"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
