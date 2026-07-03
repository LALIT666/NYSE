import axios from "axios";

export const API_BASE = "http://localhost:3000/api/v1";

export const http = axios.create({
  baseURL: API_BASE,
});

// REQUEST INTERCEPTOR:
// Har outgoing request me automatically token attach karo
// Interceptor matlab "beech me pakad lo aur kuch add karo"

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// RESPONSE INTERCEPTOR:
// Agar server 401 (Unauthorized) bheje toh auto logout karo

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("email");
      window.localStorage.href = "/login";
    }

    return Promise.reject(err);
  },
);
