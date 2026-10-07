import { createContext, useContext, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return parsed.role === "user" ? { ...parsed, role: "student" } : parsed;
  });

  const saveSession = ({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  const login = async (email, password, role) => {
    const { data } = await api.post("/auth/login", { email, password, role });
    saveSession(data);
    return data.user;
  };

  const register = async (form) => {
    const { data } = await api.post("/auth/register", form);
    saveSession(data);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const updateUser = (next) => {
    localStorage.setItem("user", JSON.stringify(next));
    setUser(next);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
