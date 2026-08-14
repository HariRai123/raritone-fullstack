import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  getProfile,
  loginUser as loginApi,
  logoutUser as logoutApi,
  updateProfile as updateProfileApi,
} from "../services/authService";

const AuthContext = createContext(null);

function readStoredUser() {
  const savedUser = localStorage.getItem("user");
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      const savedToken = localStorage.getItem("token");

      if (!savedToken) {
        if (mounted) {
          setToken(null);
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const data = await getProfile();

        if (!mounted) return;

        setToken(savedToken);
        setUser(data.user);
        localStorage.setItem("token", savedToken);
        localStorage.setItem("user", JSON.stringify(data.user));
      } catch (error) {
        const status = error.response?.status;

        console.error(
          "Authentication check failed:",
          error.response?.data || error.message,
        );

        if ((status === 401 || status === 403) && mounted) {
          logoutApi();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (credentials) => {
    const data = await loginApi(credentials);

    if (!data?.token || !data?.user) {
      throw new Error("Invalid login response from server.");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);

    return data;
  };

  const updateUserProfile = async (formData) => {
    const data = await updateProfileApi(formData);
    setUser(data.user);
    localStorage.setItem("user", JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    logoutApi();
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === "admin",
      login,
      logout,
      updateUserProfile,
    }),
    [user, token, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
