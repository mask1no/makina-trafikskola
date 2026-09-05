-- AlterTable
ALTER TABLE "TheoryExamSession" ADD COLUMN     "selectedQuestionIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
