
const BASE_URL = (
  process.env.REACT_APP_BACKEND_URL ||
  "https://pokedex-backend-2ar0.onrender.com"
).replace(/\/+$/, "");

export const isBackendConfigured = Boolean(BASE_URL);

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, { method = "GET", body, token } = {}) {
  if (!BASE_URL) {
    throw new ApiError("ยังไม่ได้ตั้งค่า Backend URL", 0);
  }

  const headers = {};

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const authToken = token || localStorage.getItem("token");

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      ...(body === undefined
        ? {}
        : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    throw new ApiError(
      "ไม่สามารถเชื่อมต่อ Backend ได้ กรุณาตรวจสอบ URL และ CORS",
      0
    );
  }

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
      (typeof payload === "string" && payload) ||
      `การเชื่อมต่อไม่สำเร็จ (HTTP ${response.status})`;

    throw new ApiError(String(message), response.status);
  }

  return payload;
}

function unwrapUser(response) {
  return (
    response?.user ||
    response?.data?.user ||
    response?.data ||
    response
  );
}

// Authentication

export async function getMe(token) {
  return unwrapUser(
    await request("/api/auth/me", { token })
  );
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

// Logout

export function logoutUser() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  return Promise.resolve({
    message: "Logged out successfully",
  });
}

// Profile
// Go Backend ปัจจุบันยังไม่มี API เหล่านี้

export async function updateMe(details) {
  return unwrapUser(
    await request("/api/users/me", {
      method: "PATCH",
      body: details,
    })
  );
}

export function changeMyPassword(details) {
  return request("/api/users/me/password", {
    method: "PATCH",
    body: details,
  });
}

// Admin
// ต้องเพิ่ม Routes ใน Go Backend ก่อนจึงจะใช้งานได้

export function getAdminSummary() {
  return request("/api/admin/summary");
}

export function getAdminUsers() {
  return request("/api/admin/users");
}

// Reviews

export function getPokemonReviews(pokemonId) {
  return request(`/api/pokemon/${pokemonId}/reviews`);
}

export function createPokemonReview(pokemonId, rating, comment) {
  return request(`/api/pokemon/${pokemonId}/reviews`, {
    method: "POST",
    body: {
      rating,
      comment,
    },
  });
}

export function updatePokemonReview(reviewId, rating, comment) {
  return request(`/api/reviews/${reviewId}`, {
    method: "PUT",
    body: {
      rating,
      comment,
    },
  });
}

export function deletePokemonReview(reviewId) {
  return request(`/api/reviews/${reviewId}`, {
    method: "DELETE",
  });
}
