// Only this file knows Go Backend endpoints. Update routes here when
// your teammate finalizes the API contract; React pages need not change.
// Optional until the real Go API is ready.
const BASE_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");

export const isBackendConfigured = Boolean(BASE_URL);

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  if (!isBackendConfigured) {
    throw new ApiError("ยังไม่ได้เชื่อม Go Backend — ตอนนี้เป็นหน้า Frontend Preview", 0);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: "include", // Contract: server-managed HttpOnly cookie session.
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const contentType = response.headers.get("content-type") || "";
  let payload = null;
  if (response.status !== 204) {
    try {
      payload = contentType.includes("application/json")
        ? await response.json()
        : await response.text();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message =
      (typeof payload === "object" && payload && (payload.message || payload.error)) ||
      `การเชื่อมต่อไม่สำเร็จ (HTTP ${response.status})`;
    throw new ApiError(String(message), response.status);
  }
  return payload;
}

function unwrapUser(response) {
  return response?.user || response?.data?.user || response?.data || response;
}

// Example contract; confirm method/path/JSON with the Go teammate.
export async function getMe() {
  return unwrapUser(await request("/auth/me"));
}
export function loginUser(credentials) {
  return request("/auth/login", { method: "POST", body: credentials });
}
export function registerUser(details) {
  return request("/auth/register", { method: "POST", body: details });
}
export function logoutUser() {
  return request("/auth/logout", { method: "POST" });
}
export async function updateMe(details) {
  return unwrapUser(await request("/users/me", { method: "PATCH", body: details }));
}
export function changeMyPassword(details) {
  return request("/users/me/password", { method: "PATCH", body: details });
}
export function getAdminSummary() {
  return request("/admin/summary");
}
export function getAdminUsers() {
  return request("/admin/users");
}
