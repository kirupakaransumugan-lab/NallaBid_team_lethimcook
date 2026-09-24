import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import registerLaptop from "../assets/procurement-illustration.png";
import { registerUser } from "../services/authService";

import "./register.css";


function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        confirm_password: "",
        role: "BUYER",
        terms_accepted: false
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    function handleChange(event) {
        const { name, value, type, checked } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value
        }));
    }


    function selectRole(role) {
        setFormData((previous) => ({
            ...previous,
            role
        }));
    }


    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!formData.full_name.trim()) {
            setError("Please enter your full name.");
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        if (formData.password !== formData.confirm_password) {
            setError("Passwords do not match.");
            return;
        }

        if (!formData.terms_accepted) {
            setError(
                "Please accept the Terms of Service and Privacy Policy."
            );
            return;
        }

        setLoading(true);

        try {
            const result = await registerUser({
                full_name: formData.full_name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: formData.role,
                terms_accepted: formData.terms_accepted
            });

            setSuccess(result.message);

            setTimeout(() => {
                navigate("/login");
            }, 1200);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }


    return (
        <main className="register-page">

            {/* LEFT SECTION */}

            <section className="register-intro">

                <div className="brand">
                    <span className="brand-main">
                        Nalla<span>Bid</span>
                    </span>

                    <small>
                        Smart Procurement Platform
                    </small>
                </div>


                <nav className="register-nav">
                    <span>Request</span>
                    <span>Compare</span>
                    <span>Choose</span>
                    <span>Grow</span>
                </nav>


                <div className="intro-content">

                    <div className="intro-line"></div>

                    <h1>
                        Join a Transparent
                        <br />
                        Procurement <span>Network</span>
                    </h1>

                    <p>
                        Create your account and become a part of a
                        smarter, fairer and more efficient procurement
                        ecosystem.
                    </p>


                    <div className="feature-grid">

                        <div className="feature">
                            <div className="feature-icon">
                                <i className="bi bi-people"></i>
                            </div>

                            <div>
                                <h3>For Buyers</h3>
                                <p>
                                    Create RFQs, compare quotations
                                    and choose the best suppliers.
                                </p>
                            </div>
                        </div>


                        <div className="feature">
                            <div className="feature-icon">
                                <i className="bi bi-handshake"></i>
                            </div>

                            <div>
                                <h3>For Suppliers</h3>
                                <p>
                                    Discover opportunities and grow
                                    your business with trusted buyers.
                                </p>
                            </div>
                        </div>


                        <div className="feature">
                            <div className="feature-icon">
                                <i className="bi bi-shield-check"></i>
                            </div>

                            <div>
                                <h3>Secure & Reliable</h3>
                                <p>
                                    Your data is protected and kept
                                    confidential.
                                </p>
                            </div>
                        </div>


                        <div className="feature">
                            <div className="feature-icon">
                                <i className="bi bi-bar-chart"></i>
                            </div>

                            <div>
                                <h3>Efficient Process</h3>
                                <p>
                                    Save time, reduce costs and make
                                    better decisions.
                                </p>
                            </div>
                        </div>

                    </div>


                    <img
                        src={registerLaptop}
                        alt="NallaBid procurement illustration"
                        className="register-laptop"
                    />


                    <div className="trusted-text">
                        Trusted Partnerships.
                        <br />
                        Stronger Tomorrows.
                    </div>

                </div>

            </section>


            {/* RIGHT SECTION */}

            <section className="register-card-section">

                <div className="register-card">

                    <div className="card-brand">
                        Nalla<span>Bid</span>

                        <small>
                            Smart Procurement Platform
                        </small>
                    </div>


                    <div className="register-heading">

                        <h2>
                            Create Your <span>Account</span>
                        </h2>

                        <p>
                            Join as a Buyer or Supplier and get
                            started today.
                        </p>

                    </div>


                    <form onSubmit={handleSubmit}>

                        {/* FULL NAME */}

                        <div className="form-group">

                            <label htmlFor="full_name">
                                Full Name
                            </label>

                            <div className="input-wrapper">

                                <i className="bi bi-person"></i>

                                <input
                                    id="full_name"
                                    type="text"
                                    name="full_name"
                                    placeholder="John Doe"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    autoComplete="name"
                                    required
                                />

                            </div>

                        </div>


                        {/* EMAIL */}

                        <div className="form-group">

                            <label htmlFor="email">
                                Email Address
                            </label>

                            <div className="input-wrapper">

                                <i className="bi bi-envelope"></i>

                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="name@email.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
                                    required
                                />

                            </div>

                        </div>


                        {/* PASSWORD */}

                        <div className="form-group">

                            <label htmlFor="password">
                                Password
                            </label>

                            <div className="input-wrapper">

                                <i className="bi bi-lock"></i>

                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="Create a strong password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
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


                        {/* CONFIRM PASSWORD */}

                        <div className="form-group">

                            <label htmlFor="confirm_password">
                                Confirm Password
                            </label>

                            <div className="input-wrapper">

                                <i className="bi bi-lock"></i>

                                <input
                                    id="confirm_password"
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="confirm_password"
                                    placeholder="Confirm your password"
                                    value={formData.confirm_password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    required
                                />

                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                >
                                    <i
                                        className={
                                            showConfirmPassword
                                                ? "bi bi-eye-slash"
                                                : "bi bi-eye"
                                        }
                                    ></i>
                                </button>

                            </div>

                        </div>


                        {/* ROLE */}

                        <div className="form-group">

                            <label>
                                I am a
                            </label>


                            <div className="role-selection">

                                <button
                                    type="button"
                                    className={
                                        formData.role === "BUYER"
                                            ? "role-card active"
                                            : "role-card"
                                    }
                                    onClick={() =>
                                        selectRole("BUYER")
                                    }
                                >

                                    <div className="role-radio">
                                        <span></span>
                                    </div>

                                    <i className="bi bi-building"></i>

                                    <div>
                                        <strong>
                                            Buyer / Company
                                        </strong>

                                        <small>
                                            Create RFQs and find suppliers
                                        </small>
                                    </div>

                                </button>


                                <button
                                    type="button"
                                    className={
                                        formData.role === "SUPPLIER"
                                            ? "role-card active"
                                            : "role-card"
                                    }
                                    onClick={() =>
                                        selectRole("SUPPLIER")
                                    }
                                >

                                    <div className="role-radio">
                                        <span></span>
                                    </div>

                                    <i className="bi bi-truck"></i>

                                    <div>
                                        <strong>
                                            Supplier
                                        </strong>

                                        <small>
                                            Find opportunities and submit
                                            quotations
                                        </small>
                                    </div>

                                </button>

                            </div>

                        </div>


                        {/* TERMS */}

                        <label className="terms">

                            <input
                                type="checkbox"
                                name="terms_accepted"
                                checked={formData.terms_accepted}
                                onChange={handleChange}
                            />

                            <span>
                                I agree to the
                                <a href="#terms">
                                    Terms of Service
                                </a>
                                and
                                <a href="#privacy">
                                    Privacy Policy
                                </a>
                            </span>

                        </label>


                        {/* ERROR */}

                        {error && (
                            <div className="register-message error">
                                <i className="bi bi-exclamation-circle"></i>
                                {error}
                            </div>
                        )}


                        {/* SUCCESS */}

                        {success && (
                            <div className="register-message success">
                                <i className="bi bi-check-circle"></i>
                                {success}
                            </div>
                        )}


                        {/* SUBMIT */}

                        <button
                            type="submit"
                            className="create-account-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span
                                        className="spinner-border spinner-border-sm"
                                    ></span>

                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <i className="bi bi-arrow-right"></i>
                                </>
                            )}
                        </button>


                        {/* DIVIDER */}

                        <div className="or-divider">
                            <span></span>
                            <small>OR</small>
                            <span></span>
                        </div>


                        {/* SOCIAL BUTTONS */}

                        <div className="social-buttons">

                            <button
                                type="button"
                                className="social-btn"
                            >
                                <strong className="google-icon">
                                    G
                                </strong>

                                Continue with Google
                            </button>


                            <button
                                type="button"
                                className="social-btn"
                            >
                                <strong className="microsoft-icon">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </strong>

                                Continue with Microsoft
                            </button>

                        </div>


                        {/* LOGIN */}

                        <p className="login-link">
                            Already have an account?

                            <Link to="/login">
                                Sign In
                            </Link>
                        </p>

                    </form>

                </div>

            </section>

        </main>
    );
}


export default Register;