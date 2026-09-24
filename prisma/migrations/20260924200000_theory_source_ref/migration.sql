ALTER TABLE "TheoryQuestion" ADD COLUMN "sourceRef" TEXT;

CREATE UNIQUE INDEX "TheoryQuestion_sourceRef_key" ON "TheoryQuestion"("sourceRef");
