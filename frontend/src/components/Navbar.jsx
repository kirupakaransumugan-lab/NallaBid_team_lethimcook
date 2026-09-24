import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
    logout,
    getCurrentUser
} from "../services/authService";

import sidebarCard from "../assets/sidebar-card.png.png";


function Navbar({ children }) {
    const [menuOpen, setMenuOpen] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    // Logged-in user
    const currentUser = getCurrentUser();

    // BUYER or SUPPLIER
    const userRole = currentUser?.role;


    async function handleLogout() {
        setMenuOpen(false);

        await logout().catch(() => {});

        navigate("/login");
    }


    // Buyer navigation
    const buyerMenuItems = [
        {
            name: "Dashboard",
            icon: "bi-house",
            path: "/buyer"
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


    // Supplier navigation
    const supplierMenuItems = [
        {
            name: "Dashboard",
            icon: "bi-house",
            path: "/supplier"
        },
        {
            name: "Available RFQs",
            icon: "bi-file-earmark-text",
            path: "/supplier"
        },
        {
            name: "My Quotations",
            icon: "bi-file-earmark-check",
            path: "/supplier/quotations"
        },
        {
            name: "Reports",
            icon: "bi-bar-chart",
            path: "/supplier/reports"
        },
        {
            name: "Profile",
            icon: "bi-person",
            path: "/supplier/profile"
        }
    ];


    // Select menu according to role
    const menuItems =
        userRole === "SUPPLIER"
            ? supplierMenuItems
            : buyerMenuItems;


    // Logged-in user's display name
    const displayName =
        currentUser?.full_name || "User";


    // Show readable role
    const displayRole =
        userRole === "SUPPLIER"
            ? "Supplier"
            : userRole === "BUYER"
                ? "Procurement Manager"
                : "User";


    // Create initials from full name
    const initials = displayName
        .split(" ")
        .filter(Boolean)
        .map((name) => name[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();


    // Check which navigation item is active
    function isActive(item) {
        if (item.name === "Dashboard") {
            return location.pathname === item.path;
        }

        return location.pathname === item.path;
    }


    return (
        <div className="appLayout">

            {/* =================================
                SIDEBAR
            ================================== */}

            <aside className="sidebar">

                <div className="sidebarHeader">

                    <Link
                        to={userRole === "SUPPLIER" ? "/supplier" : "/buyer"}
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
                            className={
                                isActive(item)
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
                            placeholder={
                                userRole === "SUPPLIER"
                                    ? "Search RFQs, quotations..."
                                    : "Search RFQs, suppliers, categories..."
                            }
                        />

                    </div>


                    <div className="topbarRight">

                        <button
                            type="button"
                            className="iconButton"
                        >
                            <i className="bi bi-bell"></i>
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
                                    {initials}
                                </div>


                                <div className="profileInfo">

                                    <strong>
                                        {displayName}
                                    </strong>

                                    <small>
                                        {displayRole}
                                    </small>

                                </div>


                                <i className="bi bi-chevron-down"></i>

                            </button>


                            <ul
                                className={`dropdown-menu dropdown-menu-end${
                                    menuOpen ? " show" : ""
                                }`}
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