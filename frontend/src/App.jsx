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



// =========================
// GIDEON - SUPPLIER PAGES
// =========================

import SupplierDashboard from "./pages/supplier/SupplierDashboard";
import SupplierRFQDetails from "./pages/supplier/SupplierRFQDetails";
import QuotationForm from "./pages/supplier/QuotationForm";
import MyQuotations from "./pages/supplier/MyQuotations";
import SupplierAwardResult from "./pages/supplier/AwardResult";


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


function App() {
    return (
        <BrowserRouter>

            <Routes>

                {/* =========================
                    AUTH
                ========================= */}

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />


                {/* =========================
                    BUYER
                    Existing Team Lead Work
                ========================= */}

                <Route
                    path="/buyer"
                    element={
                        <Navbar>
                            <BuyerDashboard />
                        </Navbar>
                    }
                />


                {/* =========================
                    SUPPLIER
                    Gideon's Work
                ========================= */}

                <Route
                    path="/supplier"
                    element={
                        <Navbar>
                            <SupplierDashboard />
                        </Navbar>
                    }
                />

                <Route
                    path="/supplier/rfqs/:rfqId"
                    element={
                        <Navbar>
                            <SupplierRFQDetails />
                        </Navbar>
                    }
                />

                <Route
                    path="/supplier/rfqs/:rfqId/quotation"
                    element={
                        <Navbar>
                            <QuotationForm />
                        </Navbar>
                    }
                />

                <Route
                    path="/supplier/quotations"
                    element={
                        <Navbar>
                            <MyQuotations />
                        </Navbar>
                    }
                />

                <Route
                    path="/supplier/rfqs/:rfqId/award"
                    element={
                        <Navbar>
                            <SupplierAwardResult />
                        </Navbar>
                    }
                />


                {/* =========================
                    FALLBACK
                ========================= */}

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
                    path="/buyer/rfqs/create"
                    element={
                        <RequireRole role="BUYER">
                            <CreateRFQ />
                        </RequireRole>
                    }
                />

                <Route
                    path="/rfqs"
                    element={
                        <RequireRole role="BUYER">
                            <Navbar>
                                <MyRFQs />
                            </Navbar>
                        </RequireRole>
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}


export default App;