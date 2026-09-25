import {
    BrowserRouter,
    Navigate,
    Routes,
    Route,
    useParams
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import CreateRFQ from "./pages/buyer/CreateRFQ";
import MyRFQs from "./pages/buyer/myRFQs";

import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import RFQDetails from "./pages/buyer/RFQDetails";
import Comparison from "./pages/buyer/Comparison";
import AwardResult from "./pages/buyer/AwardResult";
import Quotations from "./pages/buyer/Quotations";
import Suppliers from "./pages/buyer/Suppliers";
import SupplierProfile from "./pages/buyer/SupplierProfile";
import Profile from "./pages/Profile";
import Reports from "./pages/reports/Reports";
import ReportDetail from "./pages/reports/ReportDetail";
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


// The Buyer Dashboard links to /buyer/... paths; the pages live at the sidebar paths.
const BUYER_PATH_ALIASES = {
    "/buyer/rfqs": "/rfqs",
    "/buyer/suppliers": "/suppliers",
    "/buyer/reports": "/reports",
    "/buyer/profile": "/profile"
};


function BuyerRFQRedirect() {
    const { rfqId } = useParams();

    return <Navigate to={`/rfqs/${rfqId}`} replace />;
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

                {/* =========================
                    PROFILE (same page; each role at its own sidebar path)
                ========================= */}

                <Route
                    path="/profile"
                    element={
                        <RequireRole role="BUYER">
                            <Navbar>
                                <Profile />
                            </Navbar>
                        </RequireRole>
                    }
                />

                <Route
                    path="/supplier/profile"
                    element={
                        <RequireRole role="SUPPLIER">
                            <Navbar>
                                <Profile />
                            </Navbar>
                        </RequireRole>
                    }
                />

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


                {/* =========================
                    AWARD WORKFLOW (BUYER)
                ========================= */}

                {Object.entries(BUYER_PATH_ALIASES).map(([from, to]) => (
                    <Route
                        key={from}
                        path={from}
                        element={<Navigate to={to} replace />}
                    />
                ))}

                {/* Dashboard "View" button; /buyer/rfqs/create above is more specific and wins. */}
                <Route
                    path="/buyer/rfqs/:rfqId"
                    element={<BuyerRFQRedirect />}
                />

                {/* My RFQs links here; without it /rfqs/:rfqId would treat "create" as an id. */}
                <Route
                    path="/rfqs/create"
                    element={<Navigate to="/buyer/rfqs/create" replace />}
                />

                <Route
                    path="/rfqs/:rfqId"
                    element={
                        <RequireRole role="BUYER">
                            <Navbar>
                                <RFQDetails />
                            </Navbar>
                        </RequireRole>
                    }
                />

                <Route
                    path="/rfqs/:rfqId/compare"
                    element={
                        <RequireRole role="BUYER">
                            <Navbar>
                                <Comparison />
                            </Navbar>
                        </RequireRole>
                    }
                />

                <Route
                    path="/awards/:rfqId"
                    element={
                        <RequireRole role="BUYER">
                            <Navbar>
                                <AwardResult />
                            </Navbar>
                        </RequireRole>
                    }
                />


                {/* =========================
                    QUOTATIONS & SUPPLIERS TABS (BUYER)
                ========================= */}

                <Route
                    path="/quotations"
                    element={
                        <RequireRole role="BUYER">
                            <Navbar>
                                <Quotations />
                            </Navbar>
                        </RequireRole>
                    }
                />

                <Route
                    path="/suppliers"
                    element={
                        <RequireRole role="BUYER">
                            <Navbar>
                                <Suppliers />
                            </Navbar>
                        </RequireRole>
                    }
                />

                <Route
                    path="/suppliers/:supplierId"
                    element={
                        <RequireRole role="BUYER">
                            <Navbar>
                                <SupplierProfile />
                            </Navbar>
                        </RequireRole>
                    }
                />


                {/* =========================
                    REPORTS (role-aware; backend enforces access)
                ========================= */}

                <Route
                    path="/reports"
                    element={
                        <RequireRole role="BUYER">
                            <Navbar>
                                <Reports />
                            </Navbar>
                        </RequireRole>
                    }
                />

                <Route
                    path="/reports/:reportType"
                    element={
                        <RequireRole role="BUYER">
                            <Navbar>
                                <ReportDetail />
                            </Navbar>
                        </RequireRole>
                    }
                />

                <Route
                    path="/supplier/reports"
                    element={
                        <RequireRole role="SUPPLIER">
                            <Navbar>
                                <Reports />
                            </Navbar>
                        </RequireRole>
                    }
                />

                <Route
                    path="/supplier/reports/:reportType"
                    element={
                        <RequireRole role="SUPPLIER">
                            <Navbar>
                                <ReportDetail />
                            </Navbar>
                        </RequireRole>
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}


export default App;