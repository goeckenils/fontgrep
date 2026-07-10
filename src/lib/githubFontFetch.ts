import { isValidFontBuffer } from "@/lib/fontBytes";

function branchCandidates(branch: string | null): string[] {
  return [
    ...new Set([branch, "main", "master"].filter((b): b is string => Boolean(b))),
  ];
}

function rawUrls(repo: string, branch: string, filePath: string): string[] {
  const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
  return [
    `https://raw.githubusercontent.com/${repo}/${branch}/${filePath}`,
    `https://raw.githubusercontent.com/${repo}/${branch}/${encodedPath}`,
  ];
}

function jsDelivrUrl(repo: string, branch: string, filePath: string): string {
  return `https://cdn.jsdelivr.net/gh/${repo}@${branch}/${filePath}`;
}

async function fetchValidatedBytes(
  url: string,
  init?: RequestInit,
): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": "fontgrep", ...init?.headers },
    });
    if (!res.ok) return null;
    const bytes = await res.arrayBuffer();
    return isValidFontBuffer(bytes) ? bytes : null;
  } catch {
    return null;
  }
}

async function fetchViaGithubContentsApi(
  repo: string,
  filePath: string,
  branch: string,
): Promise<ArrayBuffer | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;

  const encodedPath = filePath.split("/").map(encodeURIComponent).join("/");
  const apiUrl = `https://api.github.com/repos/${repo}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "fontgrep",
      },
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      encoding?: string;
      content?: string;
      download_url?: string | null;
    };

    if (json.encoding === "base64" && json.content) {
      const bin = Buffer.from(json.content.replace(/\n/g, ""), "base64");
      const bytes = bin.buffer.slice(
        bin.byteOffset,
        bin.byteOffset + bin.byteLength,
      );
      return isValidFontBuffer(bytes) ? bytes : null;
    }

    if (json.download_url) {
      return fetchValidatedBytes(json.download_url, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    return null;
  } catch {
    return null;
  }
}

/** Fetch font bytes from GitHub, probing raw URLs, jsDelivr, and Contents API. */
export async function fetchGithubFontBytes(
  repo: string,
  filePath: string,
  branch: string | null,
): Promise<{ bytes: ArrayBuffer; resolvedBranch: string } | null> {
  for (const candidate of branchCandidates(branch)) {
    for (const url of rawUrls(repo, candidate, filePath)) {
      const bytes = await fetchValidatedBytes(url, {
        next: { revalidate: 60 * 60 * 24 },
      });
      if (bytes) return { bytes, resolvedBranch: candidate };
    }

    const cdn = await fetchValidatedBytes(jsDelivrUrl(repo, candidate, filePath));
    if (cdn) return { bytes: cdn, resolvedBranch: candidate };

    const api = await fetchViaGithubContentsApi(repo, filePath, candidate);
    if (api) return { bytes: api, resolvedBranch: candidate };
  }

  return null;
}