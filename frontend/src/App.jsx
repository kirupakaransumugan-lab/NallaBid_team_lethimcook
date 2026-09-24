import {
    BrowserRouter,
    Navigate,
    Routes,
    Route
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import CreateRFQ from "./pages/buyer/CreateRFQ";
import MyRFQs from "./pages/buyer/myRFQs";

import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import { getCurrentUser, getToken } from "./services/authService";


const DASHBOARD_BY_ROLE = {
    BUYER: "/buyer",
    SUPPLIER: "/supplier"
};


function Home() {
    const user = getCurrentUser();

    if (!getToken() || !user) {
        return <Navigate to="/login" replace />;
    }

    return <Navigate to={DASHBOARD_BY_ROLE[user.role] ?? "/login"} replace />;
}


// Sends users who open another role's page to their own dashboard.
function RequireRole({ role, children }) {
    const user = getCurrentUser();

    if (!getToken() || !user) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== role) {
        return <Home />;
    }

    return children;
}


function RequireLogin({ children }) {
    if (!getToken() || !getCurrentUser()) {
        return <Navigate to="/login" replace />;
    }

    return children;
}


// Empty pages for sidebar tabs whose UI is still being built.
const EMPTY_TAB_PATHS = [
    "/quotations",
    "/reports",
    "/suppliers",
    "/profile"
];


function EmptyPage() {
    return (
        <main className="pageArea"></main>
    );
}


// Temporary until pages/supplier/SupplierDashboard.jsx is finished.
function SupplierDashboardPlaceholder() {
    return (
        <main className="pageArea p-4">
            <h1>Supplier Dashboard</h1>
            <p>The supplier dashboard is coming soon.</p>
        </main>
    );
}

function App() {
    return (
        <BrowserRouter>

            <Routes>

                <Route
                    path="/login"
                    element={<Login />}
                />

                 <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="*"
                    element={<Home />}
                />

                {EMPTY_TAB_PATHS.map((path) => (
                    <Route
                        key={path}
                        path={path}
                        element={
                            <RequireLogin>
                                <Navbar>
                                    <EmptyPage />
                                </Navbar>
                            </RequireLogin>
                        }
                    />
                ))}
                 <Route
    path="/buyer"
    element={
        <RequireRole role="BUYER">
            <Navbar>
                <BuyerDashboard />
            </Navbar>
        </RequireRole>
    }
/>
<Route
    path="/supplier"
    element={
        <RequireRole role="SUPPLIER">
            <Navbar>
                <SupplierDashboardPlaceholder />
            </Navbar>
        </RequireRole>
    }
/>
<Route
    path="/buyer/rfqs/create"
    element={<CreateRFQ />}
/>
<Route
    path="/rfqs"
    element={
        <Navbar>
            <MyRFQs />
        </Navbar>
    }
/>
            </Routes>


          

        </BrowserRouter>
    );
}

export default App;