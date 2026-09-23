function Login() {
    return (
        <div className="authPage">

            <div className="authCard">

                <div className="brand">
                    Nalla<span>Bid</span>
                </div>

                <h2>Welcome Back</h2>

                <p>
                    Sign in to your NallaBid account
                </p>

                <form>

                    <div className="mb-3">
                        <label className="form-label">
                            Email
                        </label>

                        <input
                            type="email"
                            className="form-control"
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Password
                        </label>

                        <input
                            type="password"
                            className="form-control"
                            placeholder="Enter your password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100"
                    >
                        Sign In
                    </button>

                </form>

            </div>

        </div>
    );
}

export default Login;