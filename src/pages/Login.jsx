import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Lock, User, Loader2 } from "lucide-react";
import axios from "axios";
import bgImage from "../assets/ironman-wallpaper.jpg"; // <-- BG IMAGE REMAINS HERE
import toast from "react-hot-toast";

// Define the unified brand colors
const BRAND_COLOR = "#06B6D4"; // Cyan-600
const ACCENT_COLOR = "text-indigo-600"; // Used for secondary brand accents


export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/auth/crm/login`,
                {
                    email: username,
                    password,
                }
            );

            if (!res.data.status) {
                toast.error(res.data.message || "Login failed");
                setLoading(false);
                return;
            }

            const user = res.data.user;

            // if (user.role !== "super_admin") {
            //     toast.error("Access denied. Only super admins can login.");
            //     setLoading(false);
            //     return;
            // }
            console.log("User data from API response");
            console.log("User roles from API response:", user.roles);
            const allowedRoles = ["super_admin", "region_manager", "zone_manager", "hub_manager", "store_manager"];

            // if (!allowedRoles.includes(user.roles[0]?.role)) {
            //     toast.error("Access denied. Unauthorized role.");
            //     setLoading(false);
            //     return;
            // }

            const hasRole = user.roles.some(r => allowedRoles.includes(r.role));
            if (!hasRole) {
                toast.error("Access denied. Unauthorized role.");
                setLoading(false);
                return;
            }

            // ✅ Success
            localStorage.setItem("token", res.data.accessToken);
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("auth", "true");

            localStorage.setItem("role", res.data.user.roles[0]?.role);
            console.log("User role stored in localStorage:", res.data.user.roles[0]?.role);
            const userRole = localStorage.getItem("role") || "user";
            console.log("Retrieved user role from localStorage:", userRole);

            toast.success("Login successful! Welcome back 👋");

            // slight delay so toast is visible
            setTimeout(() => {
                navigate("/dashboard");
            }, 800);

        } catch (err) {
            toast.error(
                err.response?.data?.message || "Unable to login. Try again."
            );
        } finally {
            setLoading(false);
        }
    };


    return (
        <div
            className="min-h-screen flex items-center justify-center bg-cover bg-center"
            // BACKGROUND IMAGE IS APPLIED HERE
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            {/* Soft dark overlay and subtle backdrop blur to ensure legibility */}
            <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-md"></div>

            {/* Login Card: Clean white, subtle shadow, and rounded corners */}
            <div className="relative z-10 bg-white/95 border border-gray-200 rounded-3xl shadow-2xl p-8 sm:p-10 w-[400px]">
                <div className="flex flex-col items-center mb-8">
                    {/* Logo/Icon Color: Cyan */}
                    <Shield className="h-10 w-10 text-cyan-600 mb-3" />
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
                        ADMIN PORTAL
                    </h1>
                    <p className="text-gray-500 text-sm font-medium mt-1">
                        Secure access to the CRM dashboard
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">

                    {/* Username Input */}
                    <div className="relative">
                        <User className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-800 placeholder-gray-500 rounded-lg py-3 pl-10 pr-3 transition focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-800 placeholder-gray-500 rounded-lg py-3 pl-10 pr-3 transition focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                            required
                        />
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-cyan-600 text-white font-semibold py-3 rounded-lg
                                 shadow-lg shadow-cyan-500/30
                                 hover:bg-cyan-700 transition disabled:opacity-60
                                 flex justify-center items-center text-sm tracking-wide"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            "SIGN IN"
                        )}
                    </button>

                </form>

                {/* Register Link (Using dark indigo accent color) */}
                <div className="mt-4 text-center">
                    <Link
                        to="/register"
                        className={`text-sm ${ACCENT_COLOR} hover:underline font-medium`}
                    >
                        New User? Register here
                    </Link>
                </div>

                <div className="mt-6 text-center text-xs text-gray-500">
                    © Stark Industries 2026
                </div>
            </div>
        </div>
    );
}