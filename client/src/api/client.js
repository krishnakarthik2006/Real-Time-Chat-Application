const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const SOCKET_BASE_URL = import.meta.env.VITE_SERVER_URL || "";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return {};
}

export async function request(path, options = {}) {
  const { method = "GET", token, body, isFormData = false, signal } = options;
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    signal,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}
