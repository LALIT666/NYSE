import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { wsManager } from "./api/ws";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Markets from "./pages/Markets";
import Trade from "./pages/Trade";

function Protected({ children }: { children: React.ReactNode }) {
  const isAuth = useAuthStore((s) => s.isAuthenticated);
  if (!isAuth) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFromStorage();
    wsManager.connect();
    setLoading(false);
  }, [loadFromStorage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#18181b",
            color: "#fff",
            border: "1px solid #2a2a2e",
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/markets"
          element={
            <Protected>
              <Markets />
            </Protected>
          }
        />
        <Route
          path="/trade/:market"
          element={
            <Protected>
              <Trade />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/markets" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
