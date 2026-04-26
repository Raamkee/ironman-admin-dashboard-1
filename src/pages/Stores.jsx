import React, { useEffect, useState, useCallback } from "react";
import { Switch } from "@headlessui/react";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, AlertTriangle, Check, UserCog, Loader2, Search } from "lucide-react";

// Define the unified brand colors
const BRAND_COLOR_CLASS = "text-cyan-600";
const BRAND_BG_CLASS = "bg-cyan-50";

const ModernSpinner = ({ size = "w-10 h-10", color = "border-cyan-600" }) => (
    <div className="flex justify-center items-center py-12">
        <div
            className={`${size} border-4 ${color} border-t-transparent rounded-full animate-spin`}
        />
    </div>
);

// --- Confirmation Modal Component (KEPT INTACT) ---
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText, confirmClass, isConfirming }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">

                {/* Header */}
                <div className="p-6 border-b flex items-center">
                    <AlertTriangle className="w-6 h-6 text-amber-500 mr-3" />
                    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-gray-600 mb-6">{message}</p>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={onCancel}
                            disabled={isConfirming}
                            className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition disabled:opacity-70"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isConfirming}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg text-white ${confirmClass} transition hover:opacity-90 flex items-center disabled:opacity-70`}
                        >
                            {isConfirming ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4 mr-1" />
                            )}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main HubAdmins Component ---
const Stores = () => {
    const [admins, setAdmins] = useState([]);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);
    const [search, setSearch] = useState("");
    const [isConfirming, setIsConfirming] = useState(false); // State for button loading in modal

    // MODAL STATE
    const [modal, setModal] = useState({
        isOpen: false,
        user: null,
        newStatus: null,
    });

    const LIMIT = 10;

    // ✅ Fetch data (Wrapped in useCallback)
    const loadAdmins = useCallback(async () => {
        const token = localStorage.getItem("token");
        // Ensure loading is set to true BEFORE fetch starts
        setLoading(true);

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/v1/crm/users/store-managers?search=${encodeURIComponent(
                    search
                )}&page=${page}&limit=${LIMIT}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (res.status === 403) {
                localStorage.removeItem("token");
                window.location.href = "/login";
                return;
            }

            const data = await res.json();

            if (data?.status && Array.isArray(data.data)) {
                setAdmins(data.data);
                setPagination(data.pagination || { totalPages: 0, total: 0, page: 1, startItem: 0, endItem: 0, totalItems: 0 });
            } else {
                setAdmins([]);
                setPagination({ totalPages: 0, total: 0, page: 1, startItem: 0, endItem: 0, totalItems: 0 });
            }
        } catch (err) {
            console.error("Hub Admins Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    // ✅ Unified useEffect with Debounce (Handles Initial Load, Page Change, and Search Change)
    useEffect(() => {
        // This runs immediately on mount, triggering the loader.
        const timer = setTimeout(() => {
            loadAdmins();
        }, 400); // Debounce delay

        return () => clearTimeout(timer);
    }, [page, search, loadAdmins]); // Dependencies: page, search, and loadAdmins


    const updateUserStatus = async (userId, status) => {
        const token = localStorage.getItem("token");

        let json = {
            status: status,
            id: userId
        }

        const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/v1/crm/users/update/userstatus`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(json),
            }
        );

        return res.json();
    };

    // ✅ Corrected Search Handler: Resets Page
    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(1); // Reset page to 1 on new search term
    };


    // --- Status Change Handler (Modal Trigger) ---
    const handleStatusChange = (user, checked) => {
        const newStatus = checked ? "active" : "inactive";

        setModal({
            isOpen: true,
            user,
            newStatus,
        });
    };

    // --- Confirmation Logic ---
    const handleConfirmStatusUpdate = async () => {
        const { user, newStatus } = modal;
        const oldStatus = user.status;

        setIsConfirming(true);

        // Optimistic UI update before modal close
        setAdmins((prev) =>
            prev.map((u) =>
                u.id === user.id
                    ? { ...u, status: newStatus }
                    : u
            )
        );
        setUpdatingId(user.id);
        setModal({ isOpen: false, user: null, newStatus: null }); // Close modal now

        try {
            const res = await updateUserStatus(user.id, newStatus);

            if (!res?.status) {
                throw new Error("Update failed");
            }

            toast.success(
                `User ${newStatus === "active" ? "activated" : "deactivated"} successfully`
            );
        } catch {
            // Rollback
            setAdmins((prev) =>
                prev.map((u) =>
                    u.id === user.id
                        ? { ...u, status: oldStatus }
                        : u
                )
            );
            toast.error("Failed to update user status");
        } finally {
            setUpdatingId(null);
            setIsConfirming(false);
        }
    };

    const handleCancel = () => {
        setModal({ isOpen: false, user: null, newStatus: null });
    };


    // ✅ Styled Status Badge
    const StatusBadge = ({ status }) => (
        <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
            ${status === "active"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"}
        `}
        >
            {status === "active" ? "Active" : "Inactive"}
        </span>
    );


    // Prepare modal content dynamically
    const modalConfirmText = modal.newStatus === 'active' ? 'Yes, Activate' : 'Yes, Deactivate';
    const modalConfirmClass = modal.newStatus === 'active' ? 'bg-emerald-600' : 'bg-red-600';
    const modalTitle = modal.newStatus === 'active' ? 'Activate Hub Administrator' : 'Deactivate Store Administrator';
    const modalMessage = modal.user
        ? `Are you sure you want to change the status of ${modal.user.name} (${modal.user.email}) to ${modal.newStatus.toUpperCase()}? This action will affect their access.`
        : '';


    return (
        <>
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={modal.isOpen}
                title={modalTitle}
                message={modalMessage}
                onConfirm={handleConfirmStatusUpdate}
                onCancel={handleCancel}
                confirmText={modalConfirmText}
                confirmClass={modalConfirmClass}
                isConfirming={isConfirming}
            />

            {/* HEADER + SEARCH */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800">
                    Store Administrators Management
                </h2>

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={handleSearchChange}
                        className="pl-9 pr-4 py-2 w-full sm:w-80 rounded-lg bg-gray-50 text-sm text-gray-800 placeholder-gray-500 border border-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all outline-none shadow-inner"
                    />
                </div>
            </div>

            {loading ? (
                <ModernSpinner />
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className={BRAND_BG_CLASS}>
                                <tr>
                                    {["S.No", "Name", "Email", "Phone", "Status", "Action"].map(
                                        (h) => (
                                            <th
                                                key={h}
                                                className={`py-3 px-4 text-left text-xs font-bold ${BRAND_COLOR_CLASS} uppercase tracking-wider`}
                                            >
                                                {h}
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-100">
                                {!admins.length ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="text-center py-10 text-gray-500 text-sm font-medium"
                                        >
                                            <UserCog className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                            No store administrators found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    admins.map((p, index) => (
                                        <tr key={p.id} className="hover:bg-gray-50 transition duration-150">
                                            <td className="py-3 px-4 text-sm text-gray-700">
                                                {(page - 1) * LIMIT + index + 1}
                                            </td>
                                            <td className="py-3 px-4 text-sm font-medium text-gray-800">{p.name}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">{p.email}</td>
                                            <td className="py-3 px-4 text-sm text-gray-600">{p.phone_number}</td>

                                            <td className="py-3 px-4">
                                                <StatusBadge status={p.status} />
                                            </td>

                                            {/* ACTION TOGGLE */}
                                            <td className="py-3 px-4">
                                                <Switch
                                                    checked={p.status === "active"}
                                                    disabled={updatingId === p.id}
                                                    onChange={(checked) => handleStatusChange(p, checked)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full
                                                            ${p.status === "active"
                                                            ? "bg-emerald-500"
                                                            : "bg-gray-300"}
                                                            transition-colors duration-200 ease-in-out
                                                            ${updatingId === p.id
                                                            ? "opacity-60 cursor-not-allowed"
                                                            : "hover:ring-2 hover:ring-offset-2 hover:ring-emerald-500"}
                                                        `}
                                                >
                                                    <span className="sr-only">Toggle user status</span>
                                                    {/* Inner Circle */}
                                                    <span
                                                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out
                                                                ${p.status === "active"
                                                                ? "translate-x-6"
                                                                : "translate-x-1"}
                                                            `}
                                                    />
                                                    {/* Spinner during optimistic update */}
                                                    {updatingId === p.id && (
                                                        <Loader2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white animate-spin" />
                                                    )}
                                                </Switch>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION */}
                    {pagination.totalPages >= 1 && (
                        <div className="flex items-center justify-center gap-3 mt-6 border-t pt-4">
                            <button
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                disabled={page === 1}
                                className={`w-10 h-10 flex items-center justify-center rounded-full border transition duration-150
                                                        ${page === 1
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200"}
                                                    `}
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <span className="text-base font-semibold text-gray-800 w-24 text-center">
                                Page {pagination.page || 1} / {pagination.totalPages || 1}
                            </span>

                            <button
                                onClick={() =>
                                    setPage((p) =>
                                        Math.min(p + 1, pagination.totalPages || p)
                                    )
                                }
                                disabled={page === pagination.totalPages}
                                className={`w-10 h-10 flex items-center justify-center rounded-full border transition duration-150
                                                        ${page === pagination.totalPages
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        : "bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200"}
                                                    `}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </>
    );
};

export default Stores;