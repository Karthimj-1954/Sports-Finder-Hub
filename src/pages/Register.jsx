import { createUserWithEmailAndPassword } from "firebase/auth";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";

import badminton from "../assets/sports/badminton.png";
import basketball from "../assets/sports/basketball.png";
import cricket from "../assets/sports/cricket.png";
import football from "../assets/sports/football.png";
import tennis from "../assets/sports/tennis.png";
import volleyball from "../assets/sports/volleyball.png";

function Register() {
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

    const handleRegister = async (e) => {
        e.preventDefault();

        try {
            await createUserWithEmailAndPassword(auth, email, password);

            alert("Registration successful!");

            navigate("/login");
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-left">
                <div className="auth-box">
                    <h1>CREATE ACCOUNT</h1>

                    <p>Join us today! Please enter your details.</p>

                    <form onSubmit={handleRegister}>
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
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <button type="submit">Sign up</button>
                    </form>

                    <p className="auth-link">
                        Already have an account?{" "}
                        <Link to="/login">Sign in</Link>
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

export default Register;