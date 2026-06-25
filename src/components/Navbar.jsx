import { signOut } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";

function Navbar() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);

            alert("Logged out successfully!");

            navigate("/login");
        } catch (error) {
            console.log(error);
            alert("Logout failed");
        }
    };

    return (
        <nav className="bg-blue-600 text-white px-8 py-4 shadow-lg">
            <div className="max-w-7xl mx-auto flex justify-between items-center">

                {/* Logo */}
                <Link to="/">
                    <h1 className="text-3xl font-bold hover:text-gray-200">
                        Sports Finder
                    </h1>
                </Link>

                {/* Navigation Links */}
                <div className="flex items-center gap-6">

                    <Link
                        to="/"
                        className="hover:text-gray-200 transition"
                    >
                        Home
                    </Link>

                    <Link
                        to="/partner"
                        className="hover:text-gray-200 transition"
                    >
                        Find Partner
                    </Link>

                    <Link
                        to="/create"
                        className="hover:text-gray-200 transition"
                    >
                        Create Match
                    </Link>

                    <Link
                        to="/profile"
                        className="hover:text-gray-200 transition"
                    >
                        Profile
                    </Link>

                    <Link
                        to="/notifications"
                        className="hover:text-gray-200 transition"
                    >
                        Notifications
                    </Link>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                        Logout
                    </button>

                </div>
            </div>
        </nav>
    );
}

export default Navbar;