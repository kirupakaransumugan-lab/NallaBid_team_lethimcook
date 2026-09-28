import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import registerLaptop from "../assets/procurement-illustration2.png";
import { registerUser } from "../services/authService";

import "./register.css";

function Register() {
    const navigate = useNavigate();

    // Form data
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

    // Handle form input
    function handleChange(event) {
        const { name, value, type, checked } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: type === "checkbox" ? checked : value
        }));
    }

    // Select user role
    function selectRole(role) {
        setFormData((previous) => ({
            ...previous,
            role
        }));
    }

    // Submit registration
    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setSuccess("");

        // Validate name
        if (!formData.full_name.trim()) {
            setError("Please enter your full name.");
            return;
        }

        // Validate password length
        if (formData.password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        // Validate passwords
        if (formData.password !== formData.confirm_password) {
            setError("Passwords do not match.");
            return;
        }

        // Validate terms
        if (!formData.terms_accepted) {
            setError(
                "Please accept the Terms of Service and Privacy Policy."
            );
            return;
        }

        setLoading(true);

        try {
            // Existing backend registration call
            const result = await registerUser({
                full_name: formData.full_name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                role: formData.role,
                terms_accepted: formData.terms_accepted
            });

            setSuccess(result.message);

            // Redirect to login
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
        <main
            className="register-page"
            style={{
                backgroundImage: `url(${registerLaptop})`
            }}
        >

            {/* Page overlay */}
            <div className="page-overlay"></div>


            {/* =====================================
                LEFT CONTENT
            ====================================== */}

            <section className="register-left">

                {/* Brand */}
                <div className="register-brand">

                    <div className="brand-name">
                        Nalla<span>Bid</span>
                    </div>

                    <div className="brand-subtitle">
                        Smart Procurement Platform
                    </div>

                </div>


                {/* Intro */}
                <div className="register-intro-content">

                    {/* <div className="register-line"></div> */}

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

                </div>

            </section>


            {/* =====================================
                RIGHT CONTENT
            ====================================== */}

            <section className="register-right">

                <div className="register-card">

                    {/* Card brand */}
                    <div className="card-brand">

                        <div className="card-brand-name">
                            Nalla<span>Bid</span>
                        </div>

                        <div className="card-brand-subtitle">
                            Smart Procurement Platform
                        </div>

                    </div>


                    {/* Heading */}
                    <div className="register-heading">

                        <h2>
                            Create Your <span>Account</span>
                        </h2>

                        <p>
                            Join as a Buyer or Supplier and get started today.
                        </p>

                    </div>


                    {/* Registration form */}
                    <form onSubmit={handleSubmit}>

                        {/* Full name */}
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


                        {/* Email */}
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


                        {/* Password row */}
                        <div className="password-row">

                            {/* Password */}
                            <div className="form-group">

                                <label htmlFor="password">
                                    Password
                                </label>

                                <div className="input-wrapper">

                                    <i className="bi bi-lock"></i>

                                    <input
                                        id="password"
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
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


                            {/* Confirm password */}
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
                                        aria-label={
                                            showConfirmPassword
                                                ? "Hide password"
                                                : "Show password"
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

                        </div>


                        {/* Role selection */}
                        <div className="form-group role-group">

                            <label>
                                I am a
                            </label>

                            <div className="role-selection">

                                {/* Buyer */}
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

                                    <div className="role-content">
                                        <strong>
                                            Buyer / Company
                                        </strong>
                                    </div>

                                </button>


                                {/* Supplier */}
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

                                    <div className="role-content">
                                        <strong>
                                            Supplier
                                        </strong>
                                    </div>

                                </button>

                            </div>

                        </div>


                        {/* Terms */}
                        <label className="terms">

                            <input
                                type="checkbox"
                                name="terms_accepted"
                                checked={formData.terms_accepted}
                                onChange={handleChange}
                            />

                            <span>
                                I agree to the{" "}
                                <a href="#terms">
                                    Terms of Service
                                </a>{" "}
                                and{" "}
                                <a href="#privacy">
                                    Privacy Policy
                                </a>
                            </span>

                        </label>


                        {/* Error */}
                        {error && (
                            <div
                                className="register-message error"
                                role="alert"
                            >
                                <i className="bi bi-exclamation-circle"></i>
                                {error}
                            </div>
                        )}


                        {/* Success */}
                        {success && (
                            <div
                                className="register-message success"
                                role="status"
                            >
                                <i className="bi bi-check-circle"></i>
                                {success}
                            </div>
                        )}


                        {/* Create account */}
                        <button
                            type="submit"
                            className="create-account-btn"
                            disabled={loading}
                        >

                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm"></span>
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <i className="bi bi-arrow-right"></i>
                                </>
                            )}

                        </button>


                        {/* Divider */}
                        <div className="or-divider">

                            <span></span>

                            <small>
                                OR
                            </small>

                            <span></span>

                        </div>


                        {/* Social buttons */}
                        <div className="social-buttons">

                            <button
                                type="button"
                                className="social-btn"
                            >
                                <strong className="google-icon">
                                    G
                                </strong>

                                <span>
                                    Continue with Google
                                </span>
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

                                <span>
                                    Continue with Microsoft
                                </span>
                            </button>

                        </div>


                        {/* Login link */}
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