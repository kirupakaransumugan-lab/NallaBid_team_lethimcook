import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { logout } from "../services/authService";

import sidebarCard from "../assets/sidebar-card.png.png";


function Navbar({ children }) {
    const [active, setActive] = useState("Home");
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();

    async function handleLogout() {
        setMenuOpen(false);
        await logout().catch(() => {});
        navigate("/login");
    }

    const menuItems = [
        {
            name: "Home",
            icon: "bi-house",
            path: "/"
        },
        {
            name: "My RFQs",
            icon: "bi-file-earmark-text",
            path: "/rfqs"
        },
        {
            name: "Create RFQ",
            icon: "bi-plus-circle",
            path: "/rfqs/create"
        },
        {
            name: "Quotations",
            icon: "bi-file-earmark-check",
            path: "/quotations"
        },
        {
            name: "Reports",
            icon: "bi-bar-chart",
            path: "/reports"
        },
        {
            name: "Suppliers",
            icon: "bi-people",
            path: "/suppliers"
        },
        {
            name: "Profile",
            icon: "bi-person",
            path: "/profile"
        }
    ];

    return (
        <div className="appLayout">

            {/* =================================
                SIDEBAR
            ================================== */}

            <aside className="sidebar">

                <div className="sidebarHeader">

                    <Link
                        to="/"
                        className="text-decoration-none"
                    >

                        <div className="brand">
                            Nalla<span>Bid</span>
                        </div>

                        <div className="brandText">
                            Smart Procurement Platform
                        </div>

                    </Link>

                </div>


                <nav className="sidebarNav">

                    {menuItems.map((item) => (

                        <Link
                            key={item.name}
                            to={item.path}
                            onClick={() => setActive(item.name)}
                            className={
                                active === item.name
                                    ? "navItem active"
                                    : "navItem"
                            }
                        >

                            <i
                                className={`bi ${item.icon}`}
                            ></i>

                            <span>
                                {item.name}
                            </span>

                        </Link>

                    ))}

                </nav>


                <div className="sidebarBottom">

                    <img
                        src={sidebarCard}
                        alt="Better Procurement A Brighter Tomorrow"
                        className="img-fluid sidebarCard"
                    />

                    <div className="therivu">
                        Therivu<span>X</span>
                    </div>

                </div>

            </aside>


            {/* =================================
                MAIN AREA
            ================================== */}

            <div className="mainArea">


                {/* =================================
                    TOPBAR
                ================================== */}

                <header className="topbar">

                    <div className="searchBox">

                        <i className="bi bi-search"></i>

                        <input
                            type="search"
                            placeholder="Search RFQs, suppliers, categories..."
                        />

                    </div>


                    <div className="topbarRight">

                        <button
                            type="button"
                            className="iconButton"
                        >

                            <i className="bi bi-bell"></i>

                            <span className="notification">
                                3
                            </span>

                        </button>


                        <button
                            type="button"
                            className="iconButton"
                        >

                            <i className="bi bi-chat-square-text"></i>

                        </button>


                        <button
                            type="button"
                            className="iconButton"
                        >

                            <i className="bi bi-question-circle"></i>

                        </button>


                        <div className="profileDivider"></div>


                        <div className="dropdown">

                        <button
                            type="button"
                            className="profileButton"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-expanded={menuOpen}
                        >

                            <div className="profileImage">
                                KS
                            </div>

                            <div className="profileInfo">

                                <strong>
                                    Kajan Siva
                                </strong>

                                <small>
                                    Procurement Manager
                                </small>

                            </div>

                            <i className="bi bi-chevron-down"></i>

                        </button>

                        <ul
                            className={`dropdown-menu dropdown-menu-end${menuOpen ? " show" : ""}`}
                            style={{ right: 0 }}
                        >
                            <li>
                                <button
                                    type="button"
                                    className="dropdown-item text-danger"
                                    onClick={handleLogout}
                                >
                                    <i className="bi bi-box-arrow-right me-2"></i>
                                    Logout
                                </button>
                            </li>
                        </ul>

                        </div>

                    </div>

                </header>


                {/* =================================
                    PAGE CONTENT
                ================================== */}

                <main className="mainContent">
                    {children}
                </main>

            </div>

        </div>
    );
}


export default Navbar;