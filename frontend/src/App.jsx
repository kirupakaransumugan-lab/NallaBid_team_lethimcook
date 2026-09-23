import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Register from "./pages/Register";

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
                    path="/register"
                    element={
                        <>
                            <Navbar />
                            <Register />
                        </>
                    }
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

            </Routes>

        </BrowserRouter>
    );
}

export default App;