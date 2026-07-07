import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dateKey } from "@/lib/dateKey";

// GET /api/calendar?month=YYYY-MM
// Returns, for every day in that month, what was first-solved that day and
// what revisions were due that day (with their completed/pending status).
export async function GET(req: NextRequest) {
  const monthParam = req.nextUrl.searchParams.get("month");
  const month = monthParam ?? dateKey(new Date()).slice(0, 7);

  const [year, monthIndex] = month.split("-").map(Number);
  if (!year || !monthIndex) {
    return NextResponse.json(
      { error: "month must be in YYYY-MM format" },
      { status: 400 },
    );
  }

  // Pad a few days on each side so a revision due on the 1st (rendered from
  // the previous month's last week in a typical calendar grid) still resolves.
  const rangeStart = new Date(year, monthIndex - 1 - 1, 25);
  const rangeEnd = new Date(year, monthIndex, 5);

  const [solveLogs, revisions] = await Promise.all([
    prisma.solveLog.findMany({
      where: { firstSolvedAt: { gte: rangeStart, lte: rangeEnd } },
      include: { question: true },
    }),
    prisma.revision.findMany({
      where: { dueDate: { gte: rangeStart, lte: rangeEnd } },
      include: { solveLog: { include: { question: true } } },
    }),
  ]);

  type DayEntry = {
    solved: { title: string; url: string }[];
    due: {
      title: string;
      url: string;
      intervalDay: number;
      completed: boolean;
    }[];
  };

  const byDay: Record<string, DayEntry> = {};

  function ensureDay(key: string): DayEntry {
    if (!byDay[key]) byDay[key] = { solved: [], due: [] };
    return byDay[key];
  }

  for (const log of solveLogs) {
    const key = dateKey(log.firstSolvedAt);
    ensureDay(key).solved.push({
      title: log.question.title,
      url: log.question.url,
    });
  }

  for (const rev of revisions) {
    const key = dateKey(rev.dueDate);
    ensureDay(key).due.push({
      title: rev.solveLog.question.title,
      url: rev.solveLog.question.url,
      intervalDay: rev.intervalDay,
      completed: !!rev.completedAt,
    });
  }

  return NextResponse.json({ month, days: byDay });
}
