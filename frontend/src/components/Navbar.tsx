import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

function Navbar() {
  const navigate = useNavigate();

  const email = useAuthStore((s) => s.email);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    // Store saaf karo + localStorage saaf karo
    logout();
    // Login page pe bhej do
    navigate("/login");
  };

  return (
    <nav className="bg-[#18181b] border-b border-[#2a2a2e] px-6 py-3 flex items-center justify-between">
      <div
        className="text-xl font-bold cursor-pointer"
        onClick={() => navigate("/markets")}
      >
        📈 NYSE
      </div>

      <div className="flex items-center gap-4">
        {/* User ka email dikhao */}
        <span className="text-sm text-gray-400">{email}</span>

        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1 bg-red-600 hover:bg-red-700 rounded"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
