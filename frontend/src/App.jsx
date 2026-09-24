import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";

import BuyerDashboard from "./pages/buyer/BuyerDashboard";

import SupplierDashboard from "./pages/supplier/SupplierDashboard";
import SupplierRFQDetails from "./pages/supplier/SupplierRFQDetails";
import QuotationForm from "./pages/supplier/QuotationForm";
import MyQuotations from "./pages/supplier/MyQuotations";
import SupplierAwardResult from "./pages/supplier/AwardResult";


function Home() {
    return (
        <main className="pageArea">
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


                {/* =========================
                    BUYER
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
                    path="*"
                    element={
                        <>
                            <Navbar>
                                <Home />
                            </Navbar>
                        </>
                    }
                />

            </Routes>

        </BrowserRouter>
    );
}


export default App;