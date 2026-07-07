"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

type Revision = {
  id: string;
  dueDate: string;
  completedAt: string | null;
  confidence: number | null;
  intervalDay: number;
};

type Topic = { id: string; name: string };

type Question = {
  id: string;
  title: string;
  slug: string;
  url: string;
  difficulty: Difficulty;
  notes: string | null;
  topics: Topic[];
  solveLogs: { id: string; firstSolvedAt: string; revisions: Revision[] }[];
};

type LeetCodeMeta = {
  title: string;
  slug: string;
  url: string;
  difficulty: Difficulty;
  topics: string[];
};

function looksLikeLeetCodeUrl(url: string): boolean {
  return /leetcode\.com\/problems\/[a-z0-9-]+/i.test(url);
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  EASY: "text-easy border-easy/40",
  MEDIUM: "text-medium border-medium/40",
  HARD: "text-hard border-hard/40",
};

function isDueToday(dueDate: string) {
  const due = new Date(dueDate);
  const today = new Date();
  return (
    due.getFullYear() === today.getFullYear() &&
    due.getMonth() === today.getMonth() &&
    due.getDate() === today.getDate()
  );
}

function isOverdue(dueDate: string) {
  const due = new Date(dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export default function DashboardPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [urlInput, setUrlInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<LeetCodeMeta | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Debounced auto-fill: as soon as the pasted URL looks like a valid LeetCode
  // problem link, fetch its metadata for preview (title/difficulty/topics)
  // without waiting for the user to hit submit.
  useEffect(() => {
    if (!looksLikeLeetCodeUrl(urlInput)) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch("/api/leetcode-meta", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlInput }),
        });
        const data = await res.json();
        if (!res.ok) {
          setPreview(null);
          setPreviewError(
            data.error ?? "Could not fetch metadata for that URL",
          );
        } else {
          setPreview(data.meta);
        }
      } catch {
        setPreview(null);
        setPreviewError("Could not reach the server to preview this question.");
      } finally {
        setPreviewLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [urlInput]);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/questions");
    const data = await res.json();
    setQuestions(data.questions ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput, notes: notesInput || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
      } else {
        setUrlInput("");
        setNotesInput("");
        setPreview(null);
        await loadQuestions();
      }
    } catch {
      setError("Could not reach the server. Is it running?");
    } finally {
      setSubmitting(false);
    }
  }

  async function markRevisionDone(revisionId: string, confidence: number) {
    await fetch(`/api/revisions/${revisionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confidence }),
    });
    await loadQuestions();
  }

  // Flatten all pending (not completed) revisions across all questions, sorted by due date.
  const pendingRevisions = questions
    .flatMap((q) =>
      q.solveLogs.flatMap((log) =>
        log.revisions
          .filter((r) => !r.completedAt)
          .map((r) => ({
            ...r,
            questionTitle: q.title,
            questionUrl: q.url,
            questionId: q.id,
          })),
      ),
    )
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );

  const dueOrOverdue = pendingRevisions.filter(
    (r) => isDueToday(r.dueDate) || isOverdue(r.dueDate),
  );

  return (
    <main>
      <header className="flex items-center justify-between mb-8 border-b border-line pb-4">
        <div>
          <p className="text-dim text-xs">$ dsa-tracker --status</p>
          <h1 className="text-2xl font-semibold text-cyan mt-1">DSA Tracker</h1>
        </div>
        <nav className="flex gap-4 text-sm text-dim">
          <Link href="/calendar" className="hover:text-cyan transition-colors">
            calendar
          </Link>
          <Link href="/heatmap" className="hover:text-cyan transition-colors">
            heatmap
          </Link>
          <Link href="/topics" className="hover:text-cyan transition-colors">
            topics
          </Link>
        </nav>
      </header>

      {/* Add question form */}
      <section className="terminal-panel rounded-md p-5 mb-8">
        <p className="text-dim text-xs mb-3">$ add --question</p>
        <form onSubmit={handleAddQuestion} className="flex flex-col gap-3">
          <input
            type="url"
            required
            placeholder="https://leetcode.com/problems/two-sum/"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="bg-bg border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan/60 placeholder:text-dim/60"
          />
          {previewLoading && (
            <p className="text-dim text-xs">looking up problem details...</p>
          )}
          {previewError && <p className="text-hard text-xs">{previewError}</p>}
          {preview && !previewLoading && (
            <div className="border border-cyan/30 bg-cyan/5 rounded px-3 py-2 flex items-center justify-between">
              <span className="text-sm">{preview.title}</span>
              <div className="flex items-center gap-2">
                {preview.topics.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="text-xs text-dim border border-line rounded px-2 py-0.5"
                  >
                    {t}
                  </span>
                ))}
                <span
                  className={`text-xs border rounded px-2 py-0.5 ${DIFFICULTY_STYLES[preview.difficulty]}`}
                >
                  {preview.difficulty.toLowerCase()}
                </span>
              </div>
            </div>
          )}
          <input
            type="text"
            placeholder="notes / approach (optional)"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            className="bg-bg border border-line rounded px-3 py-2 text-sm focus:outline-none focus:border-cyan/60 placeholder:text-dim/60"
          />
          <button
            type="submit"
            disabled={submitting}
            className="self-start bg-cyan/10 border border-cyan/40 text-cyan rounded px-4 py-2 text-sm hover:bg-cyan/20 transition-colors disabled:opacity-50"
          >
            {submitting ? "fetching metadata..." : "mark solved"}
          </button>
          {error && <p className="text-hard text-sm">{error}</p>}
        </form>
      </section>

      {/* Due today / overdue revisions */}
      <section className="mb-8">
        <p className="text-dim text-xs mb-3">$ revisions --due</p>
        {dueOrOverdue.length === 0 ? (
          <p className="text-dim text-sm">Nothing due today. Clean queue.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {dueOrOverdue.map((r) => (
              <div
                key={r.id}
                className="terminal-panel rounded-md px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <a
                    href={r.questionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan hover:underline text-sm"
                  >
                    {r.questionTitle}
                  </a>
                  <p className="text-dim text-xs mt-1">
                    day {r.intervalDay} revision · due {formatDate(r.dueDate)}
                    {isOverdue(r.dueDate) && (
                      <span className="text-hard ml-2">overdue</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => markRevisionDone(r.id, n)}
                      title={`confidence ${n}`}
                      className="w-7 h-7 text-xs rounded border border-line hover:border-cyan/60 hover:text-cyan transition-colors"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* All questions */}
      <section>
        <p className="text-dim text-xs mb-3">
          $ questions --all ({questions.length})
        </p>
        {loading ? (
          <p className="text-dim text-sm">loading...</p>
        ) : questions.length === 0 ? (
          <p className="text-dim text-sm">
            No questions logged yet. Paste a LeetCode URL above to start.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {questions.map((q) => (
              <div key={q.id} className="terminal-panel rounded-md px-4 py-3">
                <div className="flex items-center justify-between">
                  <a
                    href={q.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline text-sm"
                  >
                    {q.title}
                  </a>
                  <span
                    className={`text-xs border rounded px-2 py-0.5 ${DIFFICULTY_STYLES[q.difficulty]}`}
                  >
                    {q.difficulty.toLowerCase()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {q.topics.map((t) => (
                    <span
                      key={t.id}
                      className="text-xs text-dim border border-line rounded px-2 py-0.5"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
                {q.notes && <p className="text-dim text-xs mt-2">{q.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
