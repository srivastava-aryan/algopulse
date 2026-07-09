import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// GET /api/topics
// Returns every topic with how many questions you've solved under it,
// broken down by difficulty — the raw data behind the coverage dashboard.
export async function GET() {
  const topics = await prisma.topic.findMany({
    include: { questions: { select: { difficulty: true } } },
    orderBy: { name: "asc" },
  });

  const result = topics
    .map((t) => {
      const easy = t.questions.filter((q) => q.difficulty === "EASY").length;
      const medium = t.questions.filter(
        (q) => q.difficulty === "MEDIUM",
      ).length;
      const hard = t.questions.filter((q) => q.difficulty === "HARD").length;
      return {
        id: t.id,
        name: t.name,
        total: t.questions.length,
        easy,
        medium,
        hard,
      };
    })
    .sort((a, b) => b.total - a.total);

  const totalQuestions = await prisma.question.count();

  return NextResponse.json({ topics: result, totalQuestions });
}
