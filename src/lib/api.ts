const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const API_URL =
  rawApiUrl.startsWith("http://") || rawApiUrl.startsWith("https://")
    ? rawApiUrl.replace(/\/$/, "")
    : `https://${rawApiUrl.replace(/\/$/, "")}`;

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const endpoint = path.startsWith("/") ? path : `/${path}`;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text();

    throw new Error(
      `API request failed: ${res.status} ${res.statusText} - ${text}`
    );
  }

  return res.json() as Promise<T>;
}
