import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Navbar from "./components/Navbar";

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