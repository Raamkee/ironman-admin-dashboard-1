import React, { useEffect, useState, useCallback } from "react";
import { Switch } from "@headlessui/react";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, Search, Loader2, AlertTriangle, Check, Upload, Download, X } from "lucide-react";

// Define the unified brand colors
const BRAND_COLOR_CLASS = "text-cyan-600";
const BRAND_BG_CLASS = "bg-cyan-50";

// --- Confirmation Modal Component (Reused from HubAdmins) ---
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
// --- End Confirmation Modal ---

// --- Helper Components for Modern UI ---

const ModernSpinner = ({ size = "w-10 h-10", color = BRAND_COLOR_CLASS }) => (
  <div className="flex justify-center items-center py-12">
    <div
      className={`${size} border-4 ${color.replace('text-', 'border-')} border-t-transparent rounded-full animate-spin`}
    />
  </div>
);

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
// --- End Helper Components ---

const downloadSampleFile = () => {
  const headers = ["first_name", "last_name", "email", "phone_number", "password"];
  const rows = [
    ["John", "Doe", "john@example.com", "9876543210", "Pass@123"],
    ["Jane", "Smith", "jane@example.com", "9876543211", "Test@123"]
  ];

  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "delivery_partners_sample.csv";
  link.click();
};

const ImportModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null); // { success, failed, errors }

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null); // Reset results if a new file is picked
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    setIsUploading(false);
    onClose(); // Call the parent's close function
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file first");

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/crm/users/upload-block`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (data && data.summary) {
        setResult({
          success: data.summary.success,
          failed: data.summary.failed,
          errors: data.errors || []
        });
        if (data.summary.success > 0) onUploadSuccess();
      } else {
        toast.error("Invalid response from server");
      }
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const downloadFailedRows = () => {
    if (!result?.errors?.length) return;

    const firstRecordData = result.errors[0].email || {};
    const headers = Object.keys(firstRecordData);
    const headerRow = [...headers, "failure_reason"].join(",");

    const dataRows = result.errors.map(item => {
      const rowData = item.email || {};
      const reason = item.error || "Unknown error";

      return headers.map(header => {
        const value = rowData[header] ? String(rowData[header]).replace(/"/g, '""') : "";
        return `"${value}"`;
      }).concat(`"${reason.replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = [headerRow, ...dataRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `failed_delivery_partners_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold text-gray-800 mb-4">Import Delivery Partners</h3>

        {!result ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <Upload className="mx-auto text-gray-400 mb-2" size={32} />
              <input type="file" accept=".csv,.xlsx" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100" />
            </div>
            <button
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="w-full bg-cyan-600 text-white py-2 rounded-lg font-semibold hover:bg-cyan-700 disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
              {isUploading ? "Processing..." : "Upload & Import"}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex justify-around py-6 border-b mb-6">
              <div>
                <p className="text-3xl font-bold text-emerald-600">{result.success}</p>
                <p className="text-sm text-gray-500 font-medium">Success</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-red-600">{result.failed}</p>
                <p className="text-sm text-gray-500 font-medium">Failed</p>
              </div>
            </div>

            {result.failed > 0 ? (
              <button
                onClick={downloadFailedRows}
                className="w-full border-2 border-red-500 text-red-600 py-2 rounded-lg font-semibold flex justify-center items-center gap-2 hover:bg-red-50 transition"
              >
                <Download size={18} /> Download Failed Records
              </button>
            ) : (
              <button onClick={handleClose} className="w-full bg-gray-800 text-white py-2 rounded-lg">Done</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


const DeliveryPartners = () => {
  const [partners, setPartners] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState("");
  const [isConfirming, setIsConfirming] = useState(false); // State for button loading in modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // NEW MODAL STATE
  const [modal, setModal] = useState({
    isOpen: false,
    user: null,
    newStatus: null,
  });

  const LIMIT = 10;

  // ✅ Fetch data (Wrapped in useCallback)
  const loadPartners = useCallback(async () => {
    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/crm/users/delivery-partners?search=${encodeURIComponent(
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
        setPartners(data.data);
        setPagination(data.pagination || { totalPages: 0, total: 0, page: 1, startItem: 0, endItem: 0, totalItems: 0 });
      } else {
        setPartners([]);
        setPagination({ totalPages: 0, total: 0, page: 1, startItem: 0, endItem: 0, totalItems: 0 });
      }
    } catch (err) {
      console.error("Delivery Partners Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPartners();
    }, 400); // debounce

    return () => clearTimeout(timer);
  }, [page, search, loadPartners]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset page to 1 on new search term
  };


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
    setPartners((prev) =>
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
      setPartners((prev) =>
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


  // Prepare modal content dynamically
  const modalConfirmText = modal.newStatus === 'active' ? 'Yes, Activate' : 'Yes, Deactivate';
  const modalConfirmClass = modal.newStatus === 'active' ? 'bg-emerald-600' : 'bg-red-600';
  const modalTitle = modal.newStatus === 'active' ? 'Activate Delivery Partner' : 'Deactivate Delivery Partner';
  const modalMessage = modal.user
    ? `Are you sure you want to change the status of ${modal.user.name} (${modal.user.email}) to ${modal.newStatus.toUpperCase()}? This action will affect their ability to accept deliveries.`
    : '';


  // --- Render ---

  return (
    <>

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onUploadSuccess={loadPartners}
      />

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
        <h2 className="text-2xl font-bold text-gray-800 pb-1 inline-block">
          Delivery Partners Management
        </h2>

        {/* Modern Search Input */}
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

        <div className="flex gap-3 items-center">
          <button
            onClick={downloadSampleFile}
            className="px-4 py-2 rounded-lg border border-cyan-600 text-cyan-700 hover:bg-cyan-50 flex items-center gap-1"
          >
            <Download size={16} /> Sample
          </button>

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 flex items-center gap-1"
          >
            <Upload size={16} /> Import
          </button>

        </div>
      </div>

      {/* LOADING */}
      {loading ? (
        <ModernSpinner />
      ) : (
        <>
          {/* TABLE */}
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

              <tbody className="bg-white divide-y divide-gray-100">
                {!partners.length ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-12 text-gray-500 text-sm font-medium"
                    >
                      No partners match your search criteria.
                    </td>
                  </tr>
                ) : (
                  partners.map((p, index) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition duration-150">
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {(page - 1) * LIMIT + index + 1}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-800">{p.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{p.email}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{p.phone_number}</td>

                      <td className="py-3 px-4">
                        <StatusBadge status={p.status} />
                      </td>

                      {/* ACTION TOGGLE */}
                      <td className="py-3 px-4">
                        <Switch
                          checked={p.status === "active"}
                          disabled={updatingId === p.id}
                          // MODIFIED: Calls the handler to trigger the modal
                          onChange={(checked) => handleStatusChange(p, checked)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full
                            ${p.status === "active"
                              ? "bg-emerald-500" // Use Emerald for active
                              : "bg-gray-300"}
                            transition-colors duration-300 ease-in-out
                            ${updatingId === p.id
                              ? "opacity-60 cursor-not-allowed"
                              : "hover:ring-2 hover:ring-offset-2 hover:ring-emerald-500"}
                          `}
                        >
                          <span className="sr-only">Toggle user status</span>
                          {/* Inner Circle */}
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-300 ease-in-out
                              ${p.status === "active"
                                ? "translate-x-6"
                                : "translate-x-1"}
                            `}
                          />
                          {/* Optional: Add spinner inside the cell if actively updating */}
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

export default DeliveryPartners;