import { signOut } from "firebase/auth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      alert("Error logging out: " + error.message);
    }
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `font-body font-medium text-sm transition-colors duration-200 py-1.5 px-3 rounded-lg ${
      isActive(path)
        ? "bg-white/20 text-white shadow-sm"
        : "text-orange-100 hover:text-white hover:bg-white/10"
    }`;

  return (
    <nav className="bg-gradient-to-r from-[#D35400] to-[#8E2F00] text-white shadow-lg sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
      <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="font-heading text-2xl font-bold tracking-wide hover:scale-105 transition-transform duration-200">
          <Link to="/" className="flex items-center gap-2">
            <span>🏟️</span>
            <span>Sports Finder Hub</span>
          </Link>
        </h1>

        <div className="flex flex-wrap gap-2 md:gap-3 items-center justify-center">
          <Link to="/" className={navLinkClass("/")}>
            Home
          </Link>
          <Link to="/partner" className={navLinkClass("/partner")}>
            Find Partners
          </Link>
          <Link to="/create" className={navLinkClass("/create")}>
            Create Play Request
          </Link>
          <Link to="/profile" className={navLinkClass("/profile")}>
            My Profile
          </Link>
          <Link to="/notifications" className={navLinkClass("/notifications")}>
            Requests
          </Link>
          <Link to="/admin" className={navLinkClass("/admin")}>
            Admin
          </Link>

          <button
            onClick={handleLogout}
            className="font-body font-semibold ml-2 bg-red-500/90 hover:bg-red-600 text-white text-sm px-4 py-1.5 rounded-lg shadow transition-all duration-200 hover:shadow-md"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;