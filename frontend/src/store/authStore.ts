import { create } from "zustand";
import { http } from "../api/http";

interface AuthState {
  // State
  token: string | null;
  userId: string | null;
  email: string | null;
  isAuthenticated: boolean;

  // Actions
  signin: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  email: null,
  isAuthenticated: false,

  signin: async (email, password) => {
    const res = await http.post<{ token: string }>("/auth/signin", {
      email,
      password,
    });

    const token = res.data.token;

    localStorage.setItem("token", token);

    const me = await http.get<{ userId: string; email: string }>("/auth/me");

    localStorage.setItem("userId", me.data.userId);
    localStorage.setItem("email", me.data.email);

    set({
      token,
      userId: me.data.userId,
      email: me.data.email,
      isAuthenticated: true,
    });
  },

  signup: async (email, password) => {
    await http.post("/auth/signup", { email, password });

    const res = await http.post<{ token: string }>("/auth/signin", {
      email,
      password,
    });
    const token = res.data.token;
    localStorage.setItem("token", token);

    const me = await http.get<{ userId: string; email: string }>("/auth/me");
    localStorage.setItem("userId", me.data.userId);
    localStorage.setItem("email", me.data.email);

    set({
      token,
      userId: me.data.userId,
      email: me.data.email,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");

    set({
      token: null,
      userId: null,
      email: null,
      isAuthenticated: false,
    });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const email = localStorage.getItem("email");

    if (token && userId && email) {
      set({ token, userId, email, isAuthenticated: true });
    }
  },
}));
