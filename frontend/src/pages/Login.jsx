import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { loginUser } from "../services/authService";

import "./Login.css";


// If you have the separate illustration PNG, uncomment this:
// import loginIllustration from "../assets/login-illustration.png";


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

            navigate(user.role === "BUYER" ? "/buyer" : "/");

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }


    return (
        <main className="login-page">

            {/* =========================
                TOP BRAND / NAVIGATION
            ========================== */}

            <header className="login-header">

                <div className="login-brand">

                    <div className="brand-name">
                        Nalla<span>Bid</span>
                    </div>

                    <div className="brand-subtitle">
                        Smart Procurement Platform
                    </div>

                </div>


                <nav className="login-nav">

                    <a href="#request">
                        Request
                    </a>

                    <a href="#compare">
                        Compare
                    </a>

                    <a href="#choose">
                        Choose
                    </a>

                    <a href="#grow">
                        Grow
                    </a>

                </nav>


                <div className="login-header-actions">

                    <button
                        type="button"
                        className="theme-button"
                        aria-label="Change theme"
                    >
                        <i className="bi bi-sun"></i>
                    </button>

                    <span className="header-divider"></span>

                    <button
                        type="button"
                        className="language-button"
                    >
                        English
                        <i className="bi bi-chevron-down"></i>
                    </button>

                </div>

            </header>


            {/* =========================
                MAIN CONTENT
            ========================== */}

            <div className="login-content">


                {/* =========================
                    LEFT INFORMATION SECTION
                ========================== */}

                <section className="login-intro">

                    <div className="intro-line"></div>


                    <h1>
                        Smarter Procurement
                        <br />
                        for a <span>Brighter Tomorrow</span>
                    </h1>


                    <p className="intro-description">
                        Connect buyers and suppliers through
                        transparent, efficient, and reliable RFQ
                        management.
                    </p>


                    {/* FEATURES */}

                    <div className="login-features">


                        <div className="login-feature">

                            <div className="feature-icon">
                                <i className="bi bi-shield-check"></i>
                            </div>

                            <div className="feature-content">

                                <h3>
                                    Transparent Process
                                </h3>

                                <p>
                                    Fair and open procurement
                                    for everyone
                                </p>

                            </div>

                        </div>


                        <div className="login-feature">

                            <div className="feature-icon">
                                <i className="bi bi-lightning-charge"></i>
                            </div>

                            <div className="feature-content">

                                <h3>
                                    Save Time
                                </h3>

                                <p>
                                    Digital RFQ management
                                    made simple
                                </p>

                            </div>

                        </div>


                        <div className="login-feature">

                            <div className="feature-icon">
                                <i className="bi bi-people"></i>
                            </div>

                            <div className="feature-content">

                                <h3>
                                    Trusted Network
                                </h3>

                                <p>
                                    Connect with verified
                                    buyers and suppliers
                                </p>

                            </div>

                        </div>


                        <div className="login-feature">

                            <div className="feature-icon">
                                <i className="bi bi-bar-chart"></i>
                            </div>

                            <div className="feature-content">

                                <h3>
                                    Better Decisions
                                </h3>

                                <p>
                                    Compare, evaluate and
                                    choose the best
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* ILLUSTRATION */}

                    <div className="login-illustration">

                        {/* If you have the PNG, use this:

                        <img
                            src={loginIllustration}
                            alt="NallaBid procurement illustration"
                        />

                        */}

                        <div className="illustration-placeholder">

                            <div className="rfq-card">

                                <strong>
                                    RFQ
                                </strong>

                                <span></span>
                                <span></span>
                                <span></span>
                                <span></span>

                            </div>


                            <div className="check-card">

                                <div>
                                    <i className="bi bi-check-circle-fill"></i>
                                    Request
                                </div>

                                <div>
                                    <i className="bi bi-check-circle-fill"></i>
                                    Compare
                                </div>

                                <div>
                                    <i className="bi bi-check-circle-fill"></i>
                                    Choose
                                </div>

                                <div>
                                    <i className="bi bi-check-circle-fill"></i>
                                    Grow
                                </div>

                            </div>


                            <div className="handshake-icon">
                                <i className="bi bi-handshake"></i>
                            </div>

                        </div>

                    </div>


                    <div className="trusted-label">

                        <span></span>

                        <p>
                            Trusted Procurement.
                            <br />
                            Stronger Partnerships.
                        </p>

                    </div>

                </section>


                {/* =========================
                    LOGIN CARD
                ========================== */}

                <section className="login-card-wrapper">

                    <div className="login-card">


                        {/* CARD BRAND */}

                        <div className="card-brand">

                            <div className="card-brand-name">
                                Nalla<span>Bid</span>
                            </div>

                            <small>
                                Smart Procurement Platform
                            </small>

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


                        {/* FORM */}

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
                                        placeholder="name@email.com"
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
                                            setShowPassword(
                                                !showPassword
                                            )
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


                            {error && (
                                <div className="login-error" role="alert">
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
                                    {loading ? "Signing In..." : "Sign In"}
                                </span>

                                <i className="bi bi-arrow-right"></i>

                            </button>


                            {/* DIVIDER */}

                            <div className="login-divider">

                                <span></span>

                                <small>
                                    OR
                                </small>

                                <span></span>

                            </div>


                            {/* SOCIAL BUTTONS */}

                            <div className="social-buttons">


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


                            {/* REGISTER */}

                            <p className="create-account-text">

                                Don't have an account?

                                <Link to="/register">
                                    Create Account
                                </Link>

                            </p>


                            {/* QUOTE */}

                            <div className="login-quote">

                                <span className="quote-mark">
                                    “
                                </span>

                                <p>
                                    Good procurement builds
                                    <br />
                                    stronger tomorrows.
                                </p>

                            </div>

                        </form>

                    </div>

                </section>

            </div>

        </main>
    );
}


export default Login;