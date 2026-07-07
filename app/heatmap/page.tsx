'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { dateKey } from '@/lib/dateKey';

const WEEKS_TO_SHOW = 53;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfWeek(d: Date): Date {
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - result.getDay()); // back up to Sunday
  return result;
}

function intensityClass(count: number): string {
  if (count === 0) return 'bg-line/40';
  if (count === 1) return 'bg-cyan/25';
  if (count === 2) return 'bg-cyan/50';
  if (count === 3) return 'bg-cyan/75';
  return 'bg-cyan';
}

export default function HeatmapPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/heatmap')
      .then((res) => res.json())
      .then((data) => {
        const map: Record<string, number> = {};
        for (const d of data.days ?? []) map[d.date] = d.count;
        setCounts(map);
        setLoading(false);
      });
  }, []);

  const { totalActions, currentStreak, longestStreak } = useMemo(() => {
    // Streaks: walk backward from today, count consecutive days with >= 1 action.
    let current = 0;
    const today = new Date();
    for (let i = 0; ; i++) {
      const d = new Date(today.getTime() - i * DAY_MS);
      if ((counts[dateKey(d)] ?? 0) > 0) {
        current++;
      } else if (i === 0) {
        continue; // today might just not have activity yet, don't break the streak on day 0
      } else {
        break;
      }
    }

    // Longest streak across all recorded days.
    const sortedDays = Object.keys(counts).sort();
    let longest = 0;
    let running = 0;
    let prevDate: Date | null = null;
    for (const key of sortedDays) {
      const d = new Date(key);
      if (prevDate && d.getTime() - prevDate.getTime() === DAY_MS) {
        running++;
      } else {
        running = 1;
      }
      longest = Math.max(longest, running);
      prevDate = d;
    }

    return {
      totalActions: Object.values(counts).reduce((a, b) => a + b, 0),
      currentStreak: current,
      longestStreak: longest,
    };
  }, [counts]);

  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstWeekStart = startOfWeek(new Date(today.getTime() - (WEEKS_TO_SHOW - 1) * 7 * DAY_MS));

    const result: Date[][] = [];
    for (let w = 0; w < WEEKS_TO_SHOW; w++) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(firstWeekStart.getTime() + (w * 7 + d) * DAY_MS));
      }
      result.push(week);
    }
    return result;
  }, []);

  const monthLabels = useMemo(() => {
    const labels: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      const firstDay = week[0];
      if (firstDay.getMonth() !== lastMonth) {
        labels.push({ weekIndex: i, label: firstDay.toLocaleDateString('en-US', { month: 'short' }) });
        lastMonth = firstDay.getMonth();
      }
    });
    return labels;
  }, [weeks]);

  return (
    <main>
      <header className="flex items-center justify-between mb-6 border-b border-line pb-4">
        <div>
          <p className="text-dim text-xs">$ heatmap --activity</p>
          <h1 className="text-2xl font-semibold text-cyan mt-1">Heatmap</h1>
        </div>
        <Link href="/" className="text-dim text-sm hover:text-cyan transition-colors">
          ← dashboard
        </Link>
      </header>

      {loading ? (
        <p className="text-dim text-sm">loading...</p>
      ) : (
        <>
          <div className="flex gap-6 mb-6 text-sm">
            <div className="terminal-panel rounded-md px-4 py-3">
              <p className="text-dim text-xs">actions logged</p>
              <p className="text-cyan text-xl mt-1">{totalActions}</p>
            </div>
            <div className="terminal-panel rounded-md px-4 py-3">
              <p className="text-dim text-xs">current streak</p>
              <p className="text-cyan text-xl mt-1">{currentStreak}d</p>
            </div>
            <div className="terminal-panel rounded-md px-4 py-3">
              <p className="text-dim text-xs">longest streak</p>
              <p className="text-cyan text-xl mt-1">{longestStreak}d</p>
            </div>
          </div>

          <div className="terminal-panel rounded-md p-5 overflow-x-auto">
            <div className="relative mb-2 h-4" style={{ width: weeks.length * 14 }}>
              {monthLabels.map(({ weekIndex, label }) => (
                <span
                  key={weekIndex}
                  className="absolute text-dim text-xs"
                  style={{ left: weekIndex * 14 }}
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day, di) => {
                    const key = dateKey(day);
                    const count = counts[key] ?? 0;
                    const isFuture = day.getTime() > Date.now();
                    return (
                      <div
                        key={di}
                        title={`${day.toDateString()}: ${count} action${count === 1 ? '' : 's'}`}
                        className={`w-[11px] h-[11px] rounded-sm ${
                          isFuture ? 'bg-transparent' : intensityClass(count)
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs text-dim">
              <span>less</span>
              <div className="w-[11px] h-[11px] rounded-sm bg-line/40" />
              <div className="w-[11px] h-[11px] rounded-sm bg-cyan/25" />
              <div className="w-[11px] h-[11px] rounded-sm bg-cyan/50" />
              <div className="w-[11px] h-[11px] rounded-sm bg-cyan/75" />
              <div className="w-[11px] h-[11px] rounded-sm bg-cyan" />
              <span>more</span>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
