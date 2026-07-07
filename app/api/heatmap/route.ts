import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dateKey } from '@/lib/dateKey';

// GET /api/heatmap
// Returns a day-by-day activity count: a "solve" (new SolveLog) and a
// "completed revision" both count as one unit of activity for that day.
// This answers "how active have I been on DSA prep", not just "how many
// brand-new problems have I solved".
export async function GET() {
  const [solveLogs, completedRevisions] = await Promise.all([
    prisma.solveLog.findMany({ select: { firstSolvedAt: true } }),
    prisma.revision.findMany({
      where: { completedAt: { not: null } },
      select: { completedAt: true },
    }),
  ]);

  const counts: Record<string, number> = {};

  for (const log of solveLogs) {
    const key = dateKey(log.firstSolvedAt);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  for (const rev of completedRevisions) {
    if (!rev.completedAt) continue;
    const key = dateKey(rev.completedAt);
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const days = Object.entries(counts).map(([date, count]) => ({ date, count }));

  return NextResponse.json({ days });
}
