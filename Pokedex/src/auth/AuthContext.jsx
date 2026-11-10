
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  isBackendConfigured,
  getMe,
  loginUser,
  registerUser,
  logoutUser,
  updateMe,
  changeMyPassword,
} from "../api/backend";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isBackendConfigured);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    if (!isBackendConfigured) return;

    let ignore = false;

    getMe()
      .then((person) => {
        if (!ignore) {
          setUser(person && person.id ? person : null);
        }
      })
      .catch((error) => {
        if (ignore) return;

        setUser(null);

        if (error.status !== 401) {
          setSessionError(
            "ตรวจสอบเซสชันไม่ได้ กรุณาลองใหม่ภายหลัง"
          );
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Login
  const signIn = useCallback(async ({ email, password }) => {
    const response = await loginUser({ email, password });

    // Backend ส่งชื่อ access_token
    const token = response?.access_token;

    if (!token) {
      throw new Error("Backend ไม่ได้ส่ง Access Token กลับมา");
    }

    // บันทึก Token ก่อนเรียก /api/auth/me
    localStorage.setItem("token", token);

    if (response.user) {
      localStorage.setItem(
        "user",
        JSON.stringify(response.user)
      );
    }

    const person = await getMe(token);

    if (!person || !person.id) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      throw new Error("ไม่สามารถตรวจสอบข้อมูลสมาชิกได้");
    }

    setUser(person);
    setSessionError("");

    return person;
  }, []);

  // Register
  const signUp = useCallback(async ({ name, email, password }) => {
    return registerUser({ name, email, password });
  }, []);

  // Logout
  const signOut = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  // Update profile
  const saveProfile = useCallback(async ({ name, email }) => {
    const updated = await updateMe({ name, email });

    if (updated && updated.id) {
      setUser(updated);
    }

    return updated;
  }, []);

  // Change password
  const updatePassword = useCallback(
    async ({ currentPassword, newPassword }) => {
      return changeMyPassword({
        currentPassword,
        newPassword,
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      sessionError,
      isBackendConfigured,
      signIn,
      signUp,
      signOut,
      saveProfile,
      updatePassword,
    }),
    [
      user,
      loading,
      sessionError,
      signIn,
      signUp,
      signOut,
      saveProfile,
      updatePassword,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth ต้องใช้ภายใน AuthProvider");
  }

  return context;
}
