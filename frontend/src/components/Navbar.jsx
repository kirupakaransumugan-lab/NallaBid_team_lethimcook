import { useState } from "react";
import { Link } from "react-router-dom";

import sidebarCard from "../assets/sidebar-card.png.png";

function Navbar() {

    const [active, setActive] = useState("Home");

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
        <>

            {/* Sidebar */}

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


            {/* Main topbar */}

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


                    <button
                        type="button"
                        className="profileButton"
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

                </div>

            </header>

        </>
    );
}

export default Navbar;