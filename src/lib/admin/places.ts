export function isSchoolLocation(slug: string) {
  return !/webhook|fixture/i.test(slug);
}

export function netOre(rows: { amountOre: number; refundedOre: number }[]) {
  return rows.reduce((sum, row) => sum + row.amountOre - row.refundedOre, 0);
}

export function completedLessonPayOre(lessons: { payRateOre: number | null }[]) {
  return lessons.reduce((sum, lesson) => sum + (lesson.payRateOre ?? 0), 0);
}

export function catalogueLessonValueOre(completedCount: number, singleLessonOre: number) {
  if (!Number.isSafeInteger(completedCount) || !Number.isSafeInteger(singleLessonOre)) {
    return 0;
  }
  if (completedCount < 0 || singleLessonOre < 0) return 0;
  return completedCount * singleLessonOre;
}
