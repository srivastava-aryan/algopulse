const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

export type LeetCodeMeta = {
  title: string;
  slug: string;
  url: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topics: string[];
};

/**
 * Extracts the problem slug from a LeetCode problem URL.
 * Handles both https://leetcode.com/problems/two-sum/ and
 * https://leetcode.com/problems/two-sum/description/ variants.
 */
export function slugFromUrl(url: string): string {
  const match = url.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i);
  if (!match) {
    throw new Error('Could not find a problem slug in that URL. Expected something like https://leetcode.com/problems/two-sum/');
  }
  return match[1];
}

/**
 * Fetches title, difficulty, and topic tags for a problem from LeetCode's
 * public (unauthenticated) GraphQL endpoint, keyed by titleSlug.
 */
export async function fetchLeetCodeMeta(url: string): Promise<LeetCodeMeta> {
  const slug = slugFromUrl(url);

  const query = `
    query questionMeta($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        title
        titleSlug
        difficulty
        topicTags {
          name
        }
      }
    }
  `;

  const res = await fetch(LEETCODE_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // LeetCode's endpoint expects a referer resembling a normal browser request.
      Referer: `https://leetcode.com/problems/${slug}/`,
    },
    body: JSON.stringify({ query, variables: { titleSlug: slug } }),
  });

  if (!res.ok) {
    throw new Error(`LeetCode metadata fetch failed with status ${res.status}`);
  }

  const json = await res.json();
  const q = json?.data?.question;

  if (!q) {
    throw new Error(`No LeetCode question found for slug "${slug}". Double check the URL.`);
  }

  return {
    title: q.title,
    slug: q.titleSlug,
    url: `https://leetcode.com/problems/${q.titleSlug}/`,
    difficulty: q.difficulty.toUpperCase(),
    topics: (q.topicTags || []).map((t: { name: string }) => t.name),
  };
}
