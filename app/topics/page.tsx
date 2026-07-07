"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CORE_DSA_TOPICS } from "@/lib/coreTopics";

type TopicStat = {
  id: string;
  name: string;
  total: number;
  easy: number;
  medium: number;
  hard: number;
};

type MergedTopic = TopicStat & { isCore: boolean };

export default function TopicsPage() {
  const [topics, setTopics] = useState<TopicStat[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => {
        setTopics(data.topics ?? []);
        setTotalQuestions(data.totalQuestions ?? 0);
        setLoading(false);
      });
  }, []);

  // Merge the core DSA topic list (so untouched topics show as 0, surfacing
  // gaps) with whatever topics actually exist in the DB (so anything you've
  // solved that isn't in the core list still shows up, just marked non-core).
  const merged: MergedTopic[] = useMemo(() => {
    const byName = new Map(topics.map((t) => [t.name, t]));
    const coreEntries: MergedTopic[] = CORE_DSA_TOPICS.map((name) => {
      const existing = byName.get(name);
      return existing
        ? { ...existing, isCore: true }
        : {
            id: name,
            name,
            total: 0,
            easy: 0,
            medium: 0,
            hard: 0,
            isCore: true,
          };
    });
    const coreNames = new Set(CORE_DSA_TOPICS as readonly string[]);
    const extraEntries: MergedTopic[] = topics
      .filter((t) => !coreNames.has(t.name))
      .map((t) => ({ ...t, isCore: false }));

    const all = [...coreEntries, ...extraEntries];
    // Gaps first: ascending by total, so untouched/under-practiced topics surface at the top.
    return all.sort(
      (a, b) => a.total - b.total || a.name.localeCompare(b.name),
    );
  }, [topics]);

  const visible = showAll ? merged : merged.filter((t) => t.isCore);
  const maxTotal = Math.max(1, ...merged.map((t) => t.total));
  const untouchedCount = merged.filter((t) => t.isCore && t.total === 0).length;

  return (
    <main>
      <header className="flex items-center justify-between mb-6 border-b border-line pb-4">
        <div>
          <p className="text-dim text-xs">$ topics --coverage</p>
          <h1 className="text-2xl font-semibold text-cyan mt-1">
            Topic coverage
          </h1>
        </div>
        <Link
          href="/"
          className="text-dim text-sm hover:text-cyan transition-colors"
        >
          ← dashboard
        </Link>
      </header>

      {loading ? (
        <p className="text-dim text-sm">loading...</p>
      ) : (
        <>
          <div className="flex gap-6 mb-6 text-sm">
            <div className="terminal-panel rounded-md px-4 py-3">
              <p className="text-dim text-xs">questions solved</p>
              <p className="text-cyan text-xl mt-1">{totalQuestions}</p>
            </div>
            <div className="terminal-panel rounded-md px-4 py-3">
              <p className="text-dim text-xs">untouched core topics</p>
              <p
                className={`text-xl mt-1 ${untouchedCount > 0 ? "text-hard" : "text-cyan"}`}
              >
                {untouchedCount} / {CORE_DSA_TOPICS.length}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <p className="text-dim text-xs">
              {showAll ? "all topics" : "core topics only"} · sorted weakest
              first
            </p>
            <button
              onClick={() => setShowAll((s) => !s)}
              className="text-xs text-dim hover:text-cyan border border-line rounded px-2 py-1 transition-colors"
            >
              {showAll ? "show core only" : `show all (${merged.length})`}
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {visible.map((t) => (
              <div key={t.id} className="terminal-panel rounded-md px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-sm ${t.total === 0 ? "text-dim" : ""}`}
                  >
                    {t.name}
                    {!t.isCore && (
                      <span className="text-dim text-xs ml-2">(extra)</span>
                    )}
                  </span>
                  <span className="text-xs text-dim">{t.total} solved</span>
                </div>
                <div className="flex h-2 rounded-sm overflow-hidden bg-line/40">
                  {t.total > 0 && (
                    <>
                      <div
                        className="bg-easy"
                        style={{ width: `${(t.easy / maxTotal) * 100}%` }}
                        title={`${t.easy} easy`}
                      />
                      <div
                        className="bg-medium"
                        style={{ width: `${(t.medium / maxTotal) * 100}%` }}
                        title={`${t.medium} medium`}
                      />
                      <div
                        className="bg-hard"
                        style={{ width: `${(t.hard / maxTotal) * 100}%` }}
                        title={`${t.hard} hard`}
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-4 text-xs text-dim">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-easy inline-block" /> easy
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-medium inline-block" />{" "}
              medium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm bg-hard inline-block" /> hard
            </span>
          </div>
        </>
      )}
    </main>
  );
}
