import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
        if (!ignore) setUser(person && person.id ? person : null);
      })
      .catch((error) => {
        if (ignore) return;
        setUser(null);
        if (error.status !== 401) {
          setSessionError("ตรวจสอบเซสชันไม่ได้ กรุณาลองใหม่ภายหลัง");
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const signIn = useCallback(async ({ email, password }) => {
    await loginUser({ email, password });
    const person = await getMe();
    if (!person || !person.id) {
      throw new Error("Backend ยังไม่ส่งข้อมูลสมาชิกจาก /auth/me");
    }
    setUser(person);
    setSessionError("");
    return person;
  }, []);

  const signUp = useCallback(async ({ name, email, password }) => {
    return registerUser({ name, email, password });
  }, []);

  const signOut = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  const saveProfile = useCallback(async ({ name, email }) => {
    const updated = await updateMe({ name, email });
    if (updated && updated.id) setUser(updated);
    return updated;
  }, []);

  const updatePassword = useCallback(async ({ currentPassword, newPassword }) => {
    return changeMyPassword({ currentPassword, newPassword });
  }, []);

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
    [user, loading, sessionError, signIn, signUp, signOut, saveProfile, updatePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth ต้องใช้ภายใน AuthProvider");
  return context;
}
