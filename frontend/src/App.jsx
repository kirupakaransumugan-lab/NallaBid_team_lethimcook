import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import CreateRFQ from "./pages/buyer/CreateRFQ";
import MyRFQs from "./pages/buyer/myRFQs";

import BuyerDashboard from "./pages/buyer/BuyerDashboard";

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

                <Route
                    path="*"
                    element={
                        <>
                            <Navbar />
                            <Home />
                        </>
                    }
                />
                 <Route
    path="/buyer"
    element={
        <Navbar>
            <BuyerDashboard />
        </Navbar>
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