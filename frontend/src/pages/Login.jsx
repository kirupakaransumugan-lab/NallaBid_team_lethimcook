import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { loginUser } from "../services/authService";
import loginBackground from "../assets/procurement-illustration2.png";

import "./Login.css";

function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const user = await loginUser(email.trim(), password);

            navigate({ ADMIN: "/admin", BUYER: "/buyer" }[user.role] ?? "/supplier");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="login-page">

            {/* LEFT SIDE */}
            <section className="login-left">

                {/* Background Image */}
                <img
                    src={loginBackground}
                    alt=""
                    className="login-background"
                />

                <div className="login-left-overlay"></div>

                {/* Brand */}
                <div className="login-brand">
                    <div className="brand-name">
                        Nalla<span>Bid</span>
                    </div>

                    <div className="brand-subtitle">
                        Smart Procurement Platform
                    </div>
                </div>

                {/* Main Text */}
                <div className="login-intro">

                    <div className="intro-line"></div>

                    <h1>
                        Smarter Procurement
                        <br />
                        for a <span>Brighter Tomorrow</span>
                    </h1>

                    <p>
                        Connect buyers and suppliers through transparent,
                        efficient, and reliable RFQ management.
                    </p>

                </div>

            </section>


            {/* RIGHT SIDE */}
            <section className="login-right">

                <div className="login-card">

                    {/* CARD BRAND */}
                    <div className="card-brand">

                        <div className="card-brand-name">
                            Nalla<span>Bid</span>
                        </div>

                        <div className="card-brand-subtitle">
                            Smart Procurement Platform
                        </div>

                    </div>


                    {/* HEADING */}
                    <div className="login-heading">

                        <h2>
                            Welcome <span>Back</span>
                        </h2>

                        <p>
                            Sign in to your NallaBid account
                        </p>

                    </div>


                    {/* LOGIN FORM */}
                    <form onSubmit={handleSubmit}>

                        {/* EMAIL */}
                        <div className="login-form-group">

                            <label htmlFor="email">
                                Email
                            </label>

                            <div className="login-input">

                                <i className="bi bi-envelope"></i>

                                <input
                                    id="email"
                                    type="email"
                                    placeholder="admin@gmail.com"
                                    value={email}
                                    onChange={(event) =>
                                        setEmail(event.target.value)
                                    }
                                    autoComplete="email"
                                    required
                                />

                            </div>

                        </div>


                        {/* PASSWORD */}
                        <div className="login-form-group">

                            <label htmlFor="password">
                                Password
                            </label>

                            <div className="login-input">

                                <i className="bi bi-lock"></i>

                                <input
                                    id="password"
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(event) =>
                                        setPassword(event.target.value)
                                    }
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    aria-label={
                                        showPassword
                                            ? "Hide password"
                                            : "Show password"
                                    }
                                >
                                    <i
                                        className={
                                            showPassword
                                                ? "bi bi-eye-slash"
                                                : "bi bi-eye"
                                        }
                                    ></i>
                                </button>

                            </div>

                        </div>


                        {/* REMEMBER / FORGOT */}
                        <div className="login-options">

                            <label className="remember-me">

                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(event) =>
                                        setRememberMe(
                                            event.target.checked
                                        )
                                    }
                                />

                                <span>
                                    Remember me
                                </span>

                            </label>

                            <a
                                href="#forgot-password"
                                className="forgot-password"
                            >
                                Forgot password?
                            </a>

                        </div>


                        {/* ERROR */}
                        {error && (
                            <div
                                className="login-error"
                                role="alert"
                            >
                                <i className="bi bi-exclamation-circle"></i>
                                {error}
                            </div>
                        )}


                        {/* SIGN IN */}
                        <button
                            type="submit"
                            className="sign-in-button"
                            disabled={loading}
                        >
                            <span>
                                {loading
                                    ? "Signing In..."
                                    : "Sign In"}
                            </span>

                            <i className="bi bi-arrow-right"></i>
                        </button>


                        {/* DIVIDER */}
                        <div className="login-divider">

                            <span></span>

                            <small>OR</small>

                            <span></span>

                        </div>


                        {/* SOCIAL LOGIN */}
                        <div className="social-buttons">

                            {/* GOOGLE */}
                            <button
                                type="button"
                                className="social-button"
                            >
                                <span className="google-logo">
                                    G
                                </span>

                                <span>
                                    Continue with Google
                                </span>
                            </button>


                            {/* MICROSOFT */}
                            <button
                                type="button"
                                className="social-button"
                            >
                                <span className="microsoft-logo">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </span>

                                <span>
                                    Continue with Microsoft
                                </span>
                            </button>

                        </div>


                        {/* CREATE ACCOUNT */}
                        <p className="create-account-text">
                            Don't have an account?

                            <Link to="/register">
                                Create Account
                            </Link>
                        </p>

                    </form>

                </div>

            </section>

        </main>
    );
}

export default Login;