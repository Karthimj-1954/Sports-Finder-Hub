import { signInWithEmailAndPassword } from "firebase/auth";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";

import badminton from "../assets/sports/badminton.png";
import basketball from "../assets/sports/basketball.png";
import cricket from "../assets/sports/cricket.png";
import football from "../assets/sports/football.png";
import tennis from "../assets/sports/tennis.png";
import volleyball from "../assets/sports/volleyball.png";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const sportsImages = [
        football,
        basketball,
        cricket,
        badminton,
        tennis,
        volleyball,
    ];

    const randomImage = useMemo(() => {
        const index = Math.floor(Math.random() * sportsImages.length);
        return sportsImages[index];
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            await signInWithEmailAndPassword(auth, email, password);

            alert("Login successful!");

            navigate("/");
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-left">
                <div className="auth-box">
                    <h1>WELCOME BACK</h1>

                    <p>Welcome back! Please enter your details.</p>

                    <form onSubmit={handleLogin}>
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <button type="submit">Sign in</button>
                    </form>

                    <p className="auth-link">
                        Don&apos;t have an account?{" "}
                        <Link to="/register">Sign up for free!</Link>
                    </p>
                </div>
            </div>

            <div
                className="auth-right"
                style={{
                    backgroundImage: `url(${randomImage})`,
                }}
            ></div>
        </div>
    );
}

export default Login;