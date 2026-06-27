import { signOut } from "firebase/auth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { toast } from "react-hot-toast";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const userId = auth.currentUser?.uid;

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUnreadCount(snapshot.size);
      },
      (error) => {
        console.error("Error listening to notifications: ", error);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const handleLogout = async () => {
    try {
      const uId = auth.currentUser?.uid;
      if (uId) {
        localStorage.removeItem(`loginTime_${uId}`);
      }
      await signOut(auth);
      toast.success("Successfully logged out!");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error("Error logging out: " + error.message);
    }
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `font-body font-medium text-sm transition-colors duration-200 py-1.5 px-3 rounded-lg flex items-center gap-1 ${
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
          <Link to="/communities" className={navLinkClass("/communities")}>
            Communities
          </Link>
          <Link to="/create" className={navLinkClass("/create")}>
            Create Play Request
          </Link>
          <Link to="/profile" className={navLinkClass("/profile")}>
            My Profile
          </Link>
          <Link to="/notifications" className={navLinkClass("/notifications")}>
            Requests
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                {unreadCount}
              </span>
            )}
          </Link>
          <Link to="/history" className={navLinkClass("/history")}>
            History
          </Link>
          <Link to="/admin" className={navLinkClass("/admin")}>
            Admin
          </Link>

          <button
            onClick={handleLogout}
            className="font-body font-semibold ml-2 bg-red-500/90 hover:bg-red-600 text-white text-sm px-4 py-1.5 rounded-lg shadow transition-all duration-200 hover:shadow-md cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;