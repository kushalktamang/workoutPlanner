import type { UserProfileForm } from "../types";

const TIMEOUT_MS = 120_000;

const fetchWithTimeout = async (
  url: string,
  options: RequestInit = {},
  timeoutMs: number | null = TIMEOUT_MS,
): Promise<Response> => {
  const controller = timeoutMs === null ? undefined : new AbortController();
  const timeoutId =
    timeoutMs === null
      ? undefined
      : setTimeout(() => controller?.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      ...(controller && { signal: controller.signal }),
    });
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

async function post(
  path: string,
  body: object,
  timeoutMs: number | null = TIMEOUT_MS,
) {
  const res = await fetchWithTimeout(
    `/api${path}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    timeoutMs,
  );
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}: Request failed`);
  }
  return res.json();
}

async function get(path: string) {
  const res = await fetchWithTimeout(`/api${path}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}: Request failed`);
  }
  return res.json();
}

export const api = {
  saveProfile: (profile: UserProfileForm) => {
    return post("/profile", profile);
  },
  generatePlan: (profileId: string) =>
    post("/plan/generate", { profileId }, null),
  getCurrentPlan: (profileId: string) => {
    return get(`/plan/current?profileId=${profileId}`);
  },
};
