ALTER TABLE "TheoryQuestion"
ADD COLUMN "needsReview" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "sourceCitation" TEXT;
