import { useState } from "react";
import { Link } from "react-router-dom";
import illustration from "../assets/procurement-illustration.png";
import "./Register.css";

function Register() {
  const [role, setRole] = useState("buyer");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <main className="register-page">

      <nav className="register-navbar">
        <Link to="/" className="register-brand">
          <span className="brand-white">Nalla</span>
          <span className="brand-blue">Bid</span>

          <small>Smart Procurement Platform</small>
        </Link>

        <div className="register-nav-links">
          <a href="#request">Request</a>
          <a href="#compare">Compare</a>
          <a href="#choose">Choose</a>
          <a href="#grow">Grow</a>
        </div>

        <div className="register-nav-actions">
          <button type="button" className="theme-button">
            <i className="bi bi-sun"></i>
          </button>

          <span className="nav-divider"></span>

          <button type="button" className="language-button">
            English
            <i className="bi bi-chevron-down"></i>
          </button>
        </div>
      </nav>

      <section className="register-container">

        <div className="register-intro">

          <div className="intro-line"></div>

          <h1>
            Join a Transparent
            <span> Procurement Network</span>
          </h1>

          <p className="intro-description">
            Create your account and become a part of a smarter,
            fairer and more efficient procurement ecosystem.
          </p>

          <div className="feature-grid">

            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-people"></i>
              </div>

              <div>
                <h3>For Buyers</h3>
                <p>
                  Create RFQs, compare quotations and choose
                  the best suppliers.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-handshake"></i>
              </div>

              <div>
                <h3>For Suppliers</h3>
                <p>
                  Discover opportunities and grow your business
                  with trusted buyers.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-shield-check"></i>
              </div>

              <div>
                <h3>Secure & Reliable</h3>
                <p>
                  Your data is protected and kept confidential.
                </p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-bar-chart"></i>
              </div>

              <div>
                <h3>Efficient Process</h3>
                <p>
                  Save time, reduce costs and make better decisions.
                </p>
              </div>
            </div>

          </div>

          <div className="register-illustration">
            <img
              src={illustration}
              alt="NallaBid procurement platform"
            />
          </div>

          <p className="trust-message">
            <span></span>
            Trusted Partnerships.
            <br />
            Stronger Tomorrows.
          </p>

        </div>

        <div className="register-card">

          <div className="card-brand">
            <span className="brand-white">Nalla</span>
            <span className="brand-blue">Bid</span>
            <small>Smart Procurement Platform</small>
          </div>

          <div className="register-heading">
            <h2>
              Create Your <span>Account</span>
            </h2>

            <p>
              Join as a Buyer or Supplier and get started today.
            </p>
          </div>

          <form>

            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>

              <div className="input-wrapper">
                <i className="bi bi-person"></i>

                <input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>

              <div className="input-wrapper">
                <i className="bi bi-envelope"></i>

                <input
                  id="email"
                  type="email"
                  placeholder="name@email.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <div className="input-wrapper">
                <i className="bi bi-lock"></i>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                />

                <button
                  type="button"
                  className="password-button"
                  onClick={() => setShowPassword(!showPassword)}
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

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password
              </label>

              <div className="input-wrapper">
                <i className="bi bi-lock"></i>

                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                />

                <button
                  type="button"
                  className="password-button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
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

            <div className="role-title">
              I am a
            </div>

            <div className="role-options">

              <button
                type="button"
                className={`role-card ${
                  role === "buyer" ? "active" : ""
                }`}
                onClick={() => setRole("buyer")}
              >
                <span className="radio-circle">
                  {role === "buyer" && <span></span>}
                </span>

                <i className="bi bi-building role-icon"></i>

                <span className="role-content">
                  <strong>Buyer / Company</strong>
                  <small>Create RFQs and find suppliers</small>
                </span>
              </button>

              <button
                type="button"
                className={`role-card ${
                  role === "supplier" ? "active" : ""
                }`}
                onClick={() => setRole("supplier")}
              >
                <span className="radio-circle">
                  {role === "supplier" && <span></span>}
                </span>

                <i className="bi bi-truck role-icon"></i>

                <span className="role-content">
                  <strong>Supplier</strong>
                  <small>Find opportunities and submit quotations</small>
                </span>
              </button>

            </div>

            <label className="terms-check">
              <input type="checkbox" />

              <span>
                I agree to the
                <a href="#terms"> Terms of Service</a>
                {" "}and
                <a href="#privacy"> Privacy Policy</a>
              </span>
            </label>

            <button type="submit" className="create-account-button">
              <span>Create Account</span>
              <i className="bi bi-arrow-right"></i>
            </button>

            <div className="or-divider">
              <span></span>
              <small>OR</small>
              <span></span>
            </div>

            <div className="social-buttons">

              <button type="button" className="social-button">
                <span className="google-icon">G</span>
                Continue with Google
              </button>

              <button type="button" className="social-button">
                <span className="microsoft-icon">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </span>

                Continue with Microsoft
              </button>

            </div>

            <p className="login-text">
              Already have an account?
              <Link to="/login"> Sign In</Link>
            </p>

          </form>

        </div>

      </section>

    </main>
  );
}

export default Register;