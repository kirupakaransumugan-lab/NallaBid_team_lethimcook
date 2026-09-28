import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
    logout,
    getCurrentUser
} from "../services/authService";

import sidebarCard from "../assets/sidebar-card2.png";

function Navbar({ children }) {
    const [menuOpen, setMenuOpen] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    const currentUser = getCurrentUser();
    const userRole = currentUser?.role;

    // ==============================
    // LOGOUT
    // ==============================

    async function handleLogout() {
        setMenuOpen(false);

        await logout().catch(() => {});

        navigate("/login");
    }

    // ==============================
    // BUYER MENU
    // ==============================

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

    // ==============================
    // SUPPLIER MENU
    // ==============================

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

    // ==============================
    // SELECT MENU BY ROLE
    // ==============================

    const menuItems =
        userRole === "SUPPLIER"
            ? supplierMenuItems
            : buyerMenuItems;

    // ==============================
    // USER INFORMATION
    // ==============================

    const displayName =
        currentUser?.full_name || "User";

    const displayRole =
        userRole === "SUPPLIER"
            ? "Supplier"
            : userRole === "BUYER"
                ? "Procurement Manager"
                : "User";

    // ==============================
    // CREATE INITIALS
    // ==============================

    const initials = displayName
        .split(" ")
        .filter(Boolean)
        .map((name) => name[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    // ==============================
    // ACTIVE NAVIGATION
    // ==============================

    function isActive(item) {
        return location.pathname === item.path;
    }

    return (
        <div className="appLayout">

            {/* =========================================
                SIDEBAR
            ========================================= */}

            <aside className="sidebar">

                {/* BRAND */}
                <div className="sidebarHeader">

                    <Link
                        to={
                            userRole === "SUPPLIER"
                                ? "/supplier"
                                : "/buyer"
                        }
                        className="brandLink"
                    >

                        <div className="brand">
                            Nalla<span>Bid</span>
                        </div>

                        

                    </Link>

                </div>


                {/* NAVIGATION */}
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


                {/* SYSTEM */}
                <div className="systemSection">

                    <div className="systemTitle">
                        SYSTEM
                    </div>

                    <Link
                        to="/settings"
                        className="navItem systemItem"
                    >

                        <i className="bi bi-gear"></i>

                        <span>
                            Settings
                        </span>

                        <i className="bi bi-chevron-right systemArrow"></i>

                    </Link>


                    <Link
                        to="/help"
                        className="navItem"
                    >

                        <i className="bi bi-question-circle"></i>

                        <span>
                            Help Center
                        </span>

                    </Link>

                </div>


                {/* SIDEBAR CARD */}
                <div className="sidebarBottom">

                    <img
                        src={sidebarCard}
                        alt="Stronger Suppliers Brighter Possibilities"
                        className="sidebarCard"
                    />

                </div>

            </aside>


            {/* =========================================
                MAIN AREA
            ========================================= */}

            <div className="mainArea">


                {/* =====================================
                    TOPBAR
                ===================================== */}

                <header className="topbar">

                    {/* HAMBURGER */}
                    <button
                        type="button"
                        className="menuButton"
                    >

                        <i className="bi bi-list"></i>

                    </button>


                    {/* SEARCH */}
                    <div className="searchBox">

                        <i className="bi bi-search"></i>

                        <input
                            type="search"
                            placeholder={
                                userRole === "SUPPLIER"
                                    ? "Search RFQs, quotations..."
                                    : "Search RFQs, suppliers, categories or any request..."
                            }
                        />

                        <button
                            type="button"
                            className="searchButton"
                        >

                            <i className="bi bi-search"></i>

                        </button>

                    </div>


                    {/* =================================
                        TOPBAR RIGHT

                        Buyer View ❌
                        Training Guide ❌

                        Only:
                        Notification
                        Help
                        Profile
                    ================================= */}

                    <div className="topbarRight">

                        {/* NOTIFICATION */}
                        <button
                            type="button"
                            className="iconButton notificationButton"
                        >

                            <i className="bi bi-bell"></i>

                            <span className="notificationBadge">
                                1
                            </span>

                        </button>


                        {/* HELP */}
                        <button
                            type="button"
                            className="iconButton"
                        >

                            <i className="bi bi-question-circle"></i>

                        </button>


                        {/* DIVIDER */}
                        <div className="profileDivider"></div>


                        {/* PROFILE */}
                        <div className="profileDropdown">

                            <button
                                type="button"
                                className="profileButton"
                                onClick={() =>
                                    setMenuOpen(!menuOpen)
                                }
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


                            {/* LOGOUT MENU */}
                            {menuOpen && (

                                <div className="profileMenu">

                                    <button
                                        type="button"
                                        onClick={handleLogout}
                                    >

                                        <i className="bi bi-box-arrow-right"></i>

                                        Logout

                                    </button>

                                </div>

                            )}

                        </div>

                    </div>

                </header>


                {/* =====================================
                    MAIN CONTENT

                    Your dashboard / RFQ / quotation
                    page will appear here.
                ===================================== */}

                <main className="mainContent">
                    {children}
                </main>

            </div>

        </div>
    );
}

export default Navbar;