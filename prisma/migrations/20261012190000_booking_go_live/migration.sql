-- AlterTable
ALTER TABLE "Product" ADD COLUMN "isIntroOffer" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "ownerGoogleEventId" TEXT;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "recurrenceEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Course" ADD COLUMN "recurrenceDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "Course" ADD COLUMN "defaultStartTime" TEXT;
ALTER TABLE "Course" ADD COLUMN "durationMinutes" INTEGER;
ALTER TABLE "Course" ADD COLUMN "defaultCapacity" INTEGER;
ALTER TABLE "Course" ADD COLUMN "defaultVenueName" TEXT;
ALTER TABLE "Course" ADD COLUMN "defaultVenueAddress" TEXT;
