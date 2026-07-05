const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json") ? response.json() : {};
}

/**
 * In-flight GET deduplication map.
 * If two components call the same GET URL simultaneously, they share
 * the same Promise and only one network request is made.
 */
const inFlight = new Map();

export async function request(path, options = {}) {
  const { method = "GET", token, body, isFormData = false, signal } = options;

  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData && body !== undefined) headers["Content-Type"] = "application/json";

  const url = `${API_BASE_URL}${path}`;

  // Deduplicate concurrent identical GETs (e.g. conversation list on mount)
  const dedupeKey = method === "GET" && !signal ? `${token ?? ""}|${url}` : null;
  if (dedupeKey && inFlight.has(dedupeKey)) {
    return inFlight.get(dedupeKey);
  }

  const promise = fetch(url, {
    method,
    headers,
    body: body !== undefined
      ? (isFormData ? body : JSON.stringify(body))
      : undefined,
    signal,
  })
    .then(async (response) => {
      const data = await parseResponse(response);
      if (!response.ok) throw new Error(data.message || "Request failed.");
      return data;
    })
    .finally(() => {
      if (dedupeKey) inFlight.delete(dedupeKey);
    });

  if (dedupeKey) inFlight.set(dedupeKey, promise);

  return promise;
}
