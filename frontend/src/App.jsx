import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
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

            </Routes>


          

        </BrowserRouter>
    );
}

export default App;