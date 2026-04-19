const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000/api/v1";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = `API request failed: ${response.status}`;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) {
        detail = payload.detail;
      }
    } catch {
      // Ignore JSON parsing errors and keep the fallback message.
    }
    throw new Error(detail);
  }

  return response.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });

  return parseResponse<T>(response);
}

export async function apiPost<TResponse, TBody = unknown>(
  path: string,
  body?: TBody
): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  return parseResponse<TResponse>(response);
}
