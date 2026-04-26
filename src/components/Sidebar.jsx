import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Truck,
    Users,
    Building2,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    Home,
    User2,
    MapIcon,
    Globe,
    Store,
} from "lucide-react";

const BRAND_COLOR = "#06B6D4";

// Example: role can be 'user', 'admin', 'super_admin'
// const userRole = localStorage.getItem("role") || "user";

// const menuItems = [
//     { name: "Dashboard", path: "/dashboard", icon: Home },
//     { name: "Delivery", path: "/delivery", icon: Truck },
//     { name: "Partners", path: "/partners", icon: Users },
//     { name: "Regions", path: "/regions", icon: Globe },
//     { name: "Zones", path: "/zones", icon: MapIcon },
//     { name: "Hubs", path: "/hubs", icon: Building2 },
//     { name: "Reports", path: "/reports", icon: BarChart3 },
// ];

const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: Home, roles: ["super_admin", "region_manager", "zone_manager", , "hub_manager", "store_manager", "user"] },
    { name: "Delivery", path: "/delivery", icon: Truck, roles: ["super_admin", "region_manager", "zone_manager", , "hub_manager", "store_manager", "user"] },
    { name: "Partners", path: "/partners", icon: Users, roles: ["super_admin",  "region_manager", "zone_manager", "hub_manager", "store_manager"] },
    { name: "Regions", path: "/regions", icon: Globe, roles: ["super_admin"] },
    { name: "Zones", path: "/zones", icon: MapIcon, roles: ["super_admin", "region_manager"] },
    { name: "Hubs", path: "/hubs", icon: Building2, roles: ["super_admin", "region_manager", "zone_manager"] },
    { name: "Stores", path: "/stores", icon: Store, roles: ["super_admin", "region_manager", "zone_manager", "hub_manager"] },
    { name: "Reports", path: "/reports", icon: BarChart3, roles: ["super_admin", "region_manager", "zone_manager", "hub_manager", "store_manager", "user"] },
];

export default function Sidebar({ collapsed, onToggle, onLinkClick }) {
    const location = useLocation();
    const userRole = localStorage.getItem("role") || "user";
    const isCollapsed = collapsed !== undefined ? collapsed : false;
    const toggleSidebar = onToggle || (() => { });
    const handleLinkClick = onLinkClick || (() => { });


    return (
        <aside
            className={`h-full relative ${isCollapsed ? "w-20" : "w-64"} 
                bg-white border-r border-gray-200 flex flex-col transition-all duration-300 shadow-xl flex-shrink-0 z-50`}
        >
            {/* Header: Logo/Title and Collapse Toggle */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 h-16">
                {!isCollapsed && (
                    <h1 className="font-extrabold text-2xl tracking-wide text-cyan-600">
                        IRONMAN
                    </h1>
                )}

                <button
                    type="button"
                    onClick={toggleSidebar}
                    className={`p-2 rounded-full transition ${isCollapsed ? 'ml-auto' : ''} 
                        text-cyan-600 hover:bg-cyan-50 focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                    title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Menu */}
            {/* <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
                {menuItems.map(({ name, path, icon: Icon }) => {
                    const active = location.pathname === path;
                    return (
                        <Link
                            key={path}
                            to={path}
                            onClick={handleLinkClick}
                            className={`group flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 
                                        rounded-xl text-sm font-medium transition-all duration-300 
                                        ${active
                                    ? "bg-cyan-600 text-white shadow-md"
                                    : "text-gray-700 hover:bg-cyan-50 hover:text-cyan-600"
                                }`}
                        >
                            <Icon size={18} className={`${active ? 'text-white' : 'text-gray-500 group-hover:text-cyan-600'}`} />

                            {!isCollapsed && (
                                <span className={`${isCollapsed ? 'hidden' : 'block'}`}>{name}</span>
                            )}
                        </Link>
                    );
                })}
            </nav> */}

            <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
                {menuItems
                    .filter(item => item.roles.includes(userRole))
                    .map(({ name, path, icon: Icon }) => {
                        const active = location.pathname === path;
                        return (
                            <Link
                                key={path}
                                to={path}
                                onClick={handleLinkClick}
                                className={`group flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 
                                rounded-xl text-sm font-medium transition-all duration-300 
                                ${active
                                        ? "bg-cyan-600 text-white shadow-md"
                                        : "text-gray-700 hover:bg-cyan-50 hover:text-cyan-600"
                                    }`}
                            >
                                <Icon size={18} className={`${active ? 'text-white' : 'text-gray-500 group-hover:text-cyan-600'}`} />
                                {!isCollapsed && <span>{name}</span>}
                            </Link>
                        );
                    })}
            </nav>

            {/* Footer */}
            <div className="p-4 text-xs text-gray-500 border-t border-gray-100 text-center flex-shrink-0">
                {!isCollapsed ? "© 2026 IronMan Systems" : "©"}
            </div>
        </aside>
    );
}