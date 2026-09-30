-- AlterTable
ALTER TABLE "TeacherProfile" ADD COLUMN "calendarToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "TeacherProfile_calendarToken_key" ON "TeacherProfile"("calendarToken");
