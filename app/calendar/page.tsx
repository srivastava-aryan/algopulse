'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { dateKey } from '@/lib/dateKey';

type DayEntry = {
  solved: { title: string; url: string }[];
  due: { title: string; url: string; intervalDay: number; completed: boolean }[];
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function monthKey(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [days, setDays] = useState<Record<string, DayEntry>>({});
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const month = monthKey(cursor.getFullYear(), cursor.getMonth());

  const loadMonth = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/calendar?month=${month}`);
    const data = await res.json();
    setDays(data.days ?? {});
    setLoading(false);
  }, [month]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  // Build a 6-row x 7-col grid including leading/trailing days from adjacent months.
  const grid = useMemo(() => {
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startOffset = firstOfMonth.getDay(); // 0 = Sunday
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - startOffset);

    const cells: Date[] = [];
    for (let i = 0; i < 42; i++) {
      cells.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
    }
    return cells;
  }, [cursor]);

  function goToMonth(delta: number) {
    setSelectedKey(null);
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  const selectedEntry = selectedKey ? days[selectedKey] : null;

  return (
    <main>
      <header className="flex items-center justify-between mb-6 border-b border-line pb-4">
        <div>
          <p className="text-dim text-xs">$ calendar --view</p>
          <h1 className="text-2xl font-semibold text-cyan mt-1">Calendar</h1>
        </div>
        <Link href="/" className="text-dim text-sm hover:text-cyan transition-colors">
          ← dashboard
        </Link>
      </header>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => goToMonth(-1)}
          className="text-dim hover:text-cyan text-sm border border-line rounded px-3 py-1 transition-colors"
        >
          ← prev
        </button>
        <p className="text-cyan text-sm">
          {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
        <button
          onClick={() => goToMonth(1)}
          className="text-dim hover:text-cyan text-sm border border-line rounded px-3 py-1 transition-colors"
        >
          next →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-dim mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-dim text-sm">loading...</p>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {grid.map((day, i) => {
            const key = dateKey(day);
            const entry = days[key];
            const inMonth = day.getMonth() === cursor.getMonth();
            const isToday = key === dateKey(today);
            const solvedCount = entry?.solved.length ?? 0;
            const pendingDue = entry?.due.filter((d) => !d.completed).length ?? 0;
            const doneDue = entry?.due.filter((d) => d.completed).length ?? 0;

            return (
              <button
                key={i}
                onClick={() => setSelectedKey(key)}
                className={`terminal-panel rounded-md p-2 text-left h-20 flex flex-col justify-between transition-colors ${
                  inMonth ? '' : 'opacity-30'
                } ${selectedKey === key ? 'border-cyan/60' : ''} ${isToday ? 'ring-1 ring-cyan/50' : ''}`}
              >
                <span className={`text-xs ${isToday ? 'text-cyan' : 'text-dim'}`}>{day.getDate()}</span>
                <div className="flex flex-wrap gap-1">
                  {solvedCount > 0 && (
                    <span className="text-[10px] bg-easy/15 text-easy rounded px-1">
                      +{solvedCount}
                    </span>
                  )}
                  {pendingDue > 0 && (
                    <span className="text-[10px] bg-medium/15 text-medium rounded px-1">
                      {pendingDue} due
                    </span>
                  )}
                  {doneDue > 0 && pendingDue === 0 && (
                    <span className="text-[10px] bg-cyan/15 text-cyan rounded px-1">
                      {doneDue} ✓
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selectedKey && (
        <section className="terminal-panel rounded-md p-5 mt-6">
          <p className="text-dim text-xs mb-3">
            $ day --detail {selectedKey}
          </p>
          {!selectedEntry || (selectedEntry.solved.length === 0 && selectedEntry.due.length === 0) ? (
            <p className="text-dim text-sm">Nothing logged for this day.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {selectedEntry.solved.length > 0 && (
                <div>
                  <p className="text-easy text-xs mb-2">solved</p>
                  <div className="flex flex-col gap-1">
                    {selectedEntry.solved.map((s, i) => (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm hover:underline hover:text-cyan"
                      >
                        {s.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {selectedEntry.due.length > 0 && (
                <div>
                  <p className="text-medium text-xs mb-2">revisions due</p>
                  <div className="flex flex-col gap-1">
                    {selectedEntry.due.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:underline hover:text-cyan"
                        >
                          {d.title}
                        </a>
                        <span className="text-xs text-dim">
                          day {d.intervalDay} · {d.completed ? 'done' : 'pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
