import { Link } from "react-router-dom";

function AuthHome() {
    return (
        <div className="min-h-screen bg-teal-500 flex items-center justify-center gap-10">

            {/* Login Card */}
            <div className="bg-white p-8 rounded-lg shadow-lg w-72 text-center">
                <h2 className="text-2xl font-bold mb-6">Login</h2>

                <Link
                    to="/login"
                    className="block bg-green-600 text-white py-3 rounded hover:bg-green-700"
                >
                    Go to Login
                </Link>
            </div>

            {/* Register Card */}
            <div className="bg-white p-8 rounded-lg shadow-lg w-72 text-center">
                <h2 className="text-2xl font-bold mb-6">Signup</h2>

                <Link
                    to="/register"
                    className="block bg-green-600 text-white py-3 rounded hover:bg-green-700"
                >
                    Go to Signup
                </Link>
            </div>
        </div>
    );
}

export default AuthHome;