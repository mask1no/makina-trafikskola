import { db } from "@/lib/db";

export const MIN_PUBLIC_REVIEWS = 3;

export type PublicReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  studentName: string;
};

export type PublishedReviewSummary = {
  count: number;
  average: number;
  latest: PublicReview[];
};

export function shouldShowPublicReviews(count: number) {
  return count >= MIN_PUBLIC_REVIEWS;
}

function formatStudentName(firstName: string, lastName: string) {
  const initial = lastName.trim().charAt(0).toUpperCase();
  return initial ? `${firstName.trim()} ${initial}.` : firstName.trim();
}

export async function getPublishedReviewSummary(): Promise<PublishedReviewSummary> {
  const [aggregate, latest] = await Promise.all([
    db.review.aggregate({
      where: { published: true },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    db.review.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        student: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
  ]);

  return {
    count: aggregate._count._all,
    average: Number((aggregate._avg.rating ?? 0).toFixed(1)),
    latest: latest.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      studentName: formatStudentName(
        review.student.firstName,
        review.student.lastName,
      ),
    })),
  };
}
