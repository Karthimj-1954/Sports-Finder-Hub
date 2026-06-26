import { signInWithEmailAndPassword } from "firebase/auth";
import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";

import football from "../assets/sports/football.png";
import cricket from "../assets/sports/cricket.png";
import basketball from "../assets/sports/basketball.png";
import badminton from "../assets/sports/badminton.png";
import tennis from "../assets/sports/tennis.png";
import volleyball from "../assets/sports/volleyball.png";
import chess from "../assets/sports/chess.jpg";
import carrom from "../assets/sports/carrom.jpg";
import cards from "../assets/sports/cards.jpg";
import tableTennis from "../assets/sports/table-tennis.jpg";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();

    const sportsImages = [
        football,
        cricket,
        basketball,
        badminton,
        tennis,
        volleyball,
        chess,
        carrom,
        cards,
        tableTennis,
    ];

    const randomImage = useMemo(() => {
        // eslint-disable-next-line react-hooks/purity
        const index = Math.floor(Math.random() * sportsImages.length);
        return sportsImages[index];
    // eslint-disable-next-line react-hooks/exhaustive-deps
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