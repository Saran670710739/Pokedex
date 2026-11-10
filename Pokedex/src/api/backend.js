
const BASE_URL = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "");

export const isBackendConfigured = Boolean(BASE_URL);

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, { method = "GET", body, token } = {}) {
  if (!isBackendConfigured) {
    throw new ApiError("ยังไม่ได้ตั้งค่า Backend URL", 0);
  }

  const headers = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
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
      (typeof payload === "object" &&
        payload &&
        (payload.message || payload.error)) ||
      `การเชื่อมต่อไม่สำเร็จ (HTTP ${response.status})`;

    throw new ApiError(String(message), response.status);
  }

  return payload;
}

function unwrapUser(response) {
  return response?.user || response?.data?.user || response?.data || response;
}

export async function getMe(token) {
  return unwrapUser(await request("/api/auth/me", { token }));
}

export function loginUser(credentials) {
  return request("/api/auth/login", {
    method: "POST",
    body: credentials,
  });
}

export function registerUser(details) {
  return request("/api/auth/register", {
    method: "POST",
    body: details,
  });
  
}

export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  return Promise.resolve({ message: "Logged out successfully" });
}
