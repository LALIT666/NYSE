import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Markets from "./pages/Markets";

// Protected route wrapper component
// Ye check karta hai ki user login hai ya nahi
// Login nahi hai toh /login pe redirect kar deta hai
function Protected({ children }: { children: React.ReactNode }) {
  // Zustand store se isAuthenticated nikalo
  const isAuth = useAuthStore((s) => s.isAuthenticated);

  // Agar login nahi hai toh /login pe bhejo
  if (!isAuth) return <Navigate to="/login" replace />;

  // Login hai toh children (actual page) dikhao
  return <>{children}</>;
}

function App() {
  const loadFromStorage = useAuthStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

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

        {/* Protected route — login zaroori hai */}
        <Route
          path="/markets"
          element={
            <Protected>
              <Markets />
            </Protected>
          }
        />

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/markets" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
