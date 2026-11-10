
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

  // ตรวจสอบ Session เมื่อเปิดเว็บไซต์
  useEffect(() => {
    if (!isBackendConfigured) {
      setLoading(false);
      return;
    }

    let ignore = false;

    async function checkSession() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          if (!ignore) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        const person = await getMe(token);

        if (!ignore) {
          if (person && person.id) {
            setUser(person);
          } else {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
          }
        }
      } catch (error) {
        if (ignore) return;

        setUser(null);

        // Token หมดอายุหรือไม่ถูกต้อง
        if (error.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setSessionError("");
        } else {
          setSessionError(
            "ตรวจสอบเซสชันไม่ได้ กรุณาลองใหม่ภายหลัง"
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      ignore = true;
    };
  }, []);

  // Login
  const signIn = useCallback(async ({ email, password }) => {
    // ล้าง Session เดิมก่อน Login บัญชีใหม่
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setSessionError("");

    try {
      const response = await loginUser({
        email,
        password,
      });

      const token = response?.access_token;

      if (!token) {
        throw new Error(
          "Backend ไม่ได้ส่ง Access Token กลับมา"
        );
      }

      // บันทึก Token ของบัญชีที่ Login ใหม่
      localStorage.setItem("token", token);

      if (response.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(response.user)
        );
      }

      // ตรวจสอบข้อมูลผู้ใช้ด้วย Token ใหม่
      const person = await getMe(token);

      if (!person || !person.id) {
        throw new Error(
          "ไม่สามารถตรวจสอบข้อมูลสมาชิกได้"
        );
      }

      setUser(person);
      setSessionError("");

      return person;
    } catch (error) {
      // หาก Login ไม่สำเร็จ ให้ล้าง Session ที่เพิ่งสร้าง
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setUser(null);

      throw error;
    }
  }, []);

  // Register
  const signUp = useCallback(
    async ({ name, email, password }) => {
      return registerUser({
        name,
        email,
        password,
      });
    },
    []
  );

  // Logout
  const signOut = useCallback(async () => {
    // ล้างข้อมูลบัญชีทันที
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setSessionError("");

    await logoutUser();
  }, []);

  // Update Profile
  const saveProfile = useCallback(
    async ({ name, email }) => {
      const updated = await updateMe({
        name,
        email,
      });

      if (updated && updated.id) {
        setUser(updated);

        localStorage.setItem(
          "user",
          JSON.stringify(updated)
        );
      }

      return updated;
    },
    []
  );

  // Change Password
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
    throw new Error(
      "useAuth ต้องใช้ภายใน AuthProvider"
    );
  }

  return context;
}
