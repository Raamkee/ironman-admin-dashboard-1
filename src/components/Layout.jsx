import React, { useState, useRef, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import {
  Bell,
  Search,
  LogOut,
  Menu,
  User,
  Settings,
  Shield,
} from "lucide-react";

const BRAND_COLOR = "#06B6D4";


const formatRole = (role) =>
  role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

const LogoutConfirmationModal = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-300 scale-100 opacity-100">

        <div className="bg-red-50 p-4 border-b border-red-100 flex items-center space-x-3">
          <LogOut className="w-6 h-6 text-red-600 flex-shrink-0" />
          <h3 className="text-lg font-bold text-gray-900">Confirm Logout</h3>
        </div>

        <div className="p-6">
          <p className="text-gray-600">
            Are you sure you want to sign out? You will need to log in again to access the dashboard.
          </p>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};


export default function Layout() {
  const location = useLocation();
  const [user, setUser] = useState({ name: "", role: "" });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const userRole = localStorage.getItem("role") || "User";

  const [collapsed, setCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  const profileRef = useRef(null);

  const routeTitle = (() => {
    if (location.pathname === "/") return "Dashboard";
    const path = location.pathname.split('/').pop();
    if (!path) return "Dashboard";
    return path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
  })();

  const confirmLogout = () => {
    localStorage.removeItem("auth");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace("/login");
  };

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close profile menu when navigation changes
  useEffect(() => {
    setIsProfileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">

      <div className={`fixed inset-y-0 left-0 z-50 ${isMobileMenuOpen ? 'block' : 'hidden'} lg:relative lg:block`}>
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
          onLinkClick={() => setIsMobileMenuOpen(false)}
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <header
          className="sticky top-0 z-50 flex items-center justify-between h-16 px-6 
                     bg-white shadow-lg border-b border-gray-100"
        >
          <div className="flex items-center space-x-4">
            <button
              className="lg:hidden p-2 text-gray-500 hover:text-cyan-600 transition"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold tracking-tight text-gray-800">
              {routeTitle}
            </h1>
          </div>

          {/* Right Section: Actions and Profile */}
          <div className="flex items-center gap-4">

            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Quick search..."
                className="pl-9 pr-4 py-2 w-56 rounded-full bg-gray-100 text-sm text-gray-800 placeholder-gray-500 border border-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none shadow-inner"
              />
            </div>

            <button className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-cyan-600 transition" style={{ display: 'none' }}>
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 inline-block w-2 h-2 bg-red-500 rounded-full shadow-md" />
            </button>

            <div className="w-px h-6 bg-gray-200"></div>

            <div className="relative" ref={profileRef}>
              <button
                className="flex items-center justify-center h-10 w-10 
                           rounded-full bg-cyan-100 text-cyan-600 font-bold 
                           border-2 border-cyan-400 hover:ring-2 hover:ring-cyan-500 hover:ring-offset-2 transition-all focus:outline-none"
                title="View Profile"
                onClick={() => setIsProfileOpen(prev => !prev)}
              >
                <User className="w-5 h-5" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden transform transition duration-200 ease-out origin-top-right z-[99999]">

                  <div className="p-4 flex items-center space-x-3 border-b border-gray-100 bg-gray-50">
                    <div className="h-10 w-10 rounded-full bg-cyan-500 flex items-center justify-center text-white">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">
                        {user.first_name || "User"}
                      </span>

                      <span className="text-xs text-gray-500 flex items-center">
                        <Shield className="w-3 h-3 mr-1 text-cyan-500" />
                        {/* {user.role ? user.role.replace(/_/g, " ").toUpperCase() : "Role"} */}
                        {userRole ? formatRole(userRole) : "User"}
                      </span>
                    </div>
                  </div>

                  <div className="p-2" style={{ display: 'none' }}>
                    <a
                      href="/profile"
                      className="flex items-center space-x-3 p-3 text-sm text-gray-700 rounded-lg hover:bg-gray-100 transition"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                      <span>Profile Settings</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <button
              className="p-2 rounded-full text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
              onClick={handleLogoutClick}
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100">
          {/* <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl min-h-[90%] border border-gray-200"> */}
          <div>
            <Outlet />
          </div>
        </main>
      </div>

      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onConfirm={confirmLogout}
        onCancel={() => setIsLogoutModalOpen(false)}
      />

    </div>
  );
}