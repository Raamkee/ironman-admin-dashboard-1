import React, { useEffect, useState, useCallback } from "react";
import Select from "react-select";
import { ChevronLeft, ChevronRight, Filter, Download, XCircle, ShoppingBagIcon, CheckCircleIcon, ClockIcon, BoltIcon } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import moment from "moment";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import dayjs from "dayjs";

const BRAND_COLOR_CLASS = "text-cyan-600";
const BRAND_BG_CLASS = "bg-cyan-50";
const MIN_LOAD_TIME = 500;

const selectStyles = {
  control: (p, s) => ({
    ...p,
    borderRadius: "0.5rem",
    minHeight: "44px",
    boxShadow: s.isFocused ? "0 0 0 1px #06b6d4" : "none",
    borderColor: s.isFocused ? "#06b6d4" : p.borderColor,
    "&:hover": { borderColor: s.isFocused ? "#06b6d4" : p.borderColor }
  }),
  option: (p, s) => ({
    ...p,
    backgroundColor: s.isFocused ? "#e0f7fa" : "white",
    color: "#1f2937"
  })
};

const ModernSpinner = ({ size = "w-10 h-10", color = BRAND_COLOR_CLASS }) => (
  <div className="flex justify-center items-center py-12">
    <div className={`${size} border-4 ${color.replace("text-", "border-")} border-t-transparent rounded-full animate-spin`} />
  </div>
);

const getDateRangeParams = (range, customDates) => {
  const today = dayjs();
  let startDate = null;
  let endDate = today.format('YYYY-MM-DD');

  switch (range) {
    case "today":
      startDate = today.format('YYYY-MM-DD');
      break;
    case "yesterday":
      startDate = today.subtract(1, "day").format('YYYY-MM-DD');
      endDate = startDate;
      break;
    case "last_7_days":
      startDate = today.subtract(7, "day").format('YYYY-MM-DD');
      break;
    case "this_month":
      startDate = today.startOf("month").format('YYYY-MM-DD');
      break;
    case "last_month":
      startDate = today.subtract(1, "month").startOf("month").format('YYYY-MM-DD');
      endDate = today.subtract(1, "month").endOf("month").format('YYYY-MM-DD');
      break;
    case "custom_range":
      startDate = customDates.start ? dayjs(customDates.start).format('YYYY-MM-DD') : null;
      endDate = customDates.end ? dayjs(customDates.end).format('YYYY-MM-DD') : null;
      break;
    case "entire_data":
    default:
      startDate = null;
      endDate = null;
      break;
  }

  return { startDate, endDate };
};

const SummaryCard = ({ title, value, color, Icon, loading }) => {
  // Map the color prop to specific Tailwind classes for the icon accent
  const themeMap = {
    cyan: "bg-cyan-50 text-cyan-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  const theme = themeMap[color] || "bg-gray-50 text-gray-600";

  return (
    <div className="bg-white rounded-2xl p-6 flex items-center justify-between border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
          {title}
        </p>
        {loading ? (
          <div className="h-8 w-20 bg-gray-100 animate-pulse rounded" />
        ) : (
          <p className="text-3xl font-black text-gray-900 tracking-tight">
            {value}
          </p>
        )}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl ${theme}`}>
          <Icon className="w-7 h-7" />
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  let c = "bg-gray-100 text-gray-800";
  if (status === "Delivered") c = "bg-emerald-100 text-emerald-800";
  else if (status === "Picked-Up" || status === "In Progress") c = "bg-cyan-100 text-cyan-800";
  else if (status === "Requested") c = "bg-yellow-100 text-yellow-800";
  else if (status === "Cancelled") c = "bg-red-100 text-red-800";

  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${c}`}>{status}</span>;
};


const DateFilterDropdown = ({ selectedRange, setSelectedRange, setCustomDates }) => {
  const handleRangeChange = (e) => {
    const newRange = e.target.value;
    setSelectedRange(newRange);
    if (newRange !== "custom_range") {
      setCustomDates({ start: null, end: null });
    }
  };

  return (
    <div className="relative inline-flex items-center bg-white border border-gray-300 rounded-lg shadow-sm p-2 h-11 w-full flex-shrink-0">
      <CalendarDaysIcon className="w-5 h-5 text-cyan-600 mr-2 flex-shrink-0" />
      <select
        value={selectedRange}
        onChange={handleRangeChange}
        className="appearance-none bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer pr-6 h-full w-full"
      >
        <option value="entire_data">Entire Data (All Time)</option>
        <option value="today">Today</option>
        <option value="yesterday">Yesterday</option>
        <option value="last_7_days">Last 7 Days</option>
        <option value="this_month">This Month</option>
        <option value="last_month">Last Month</option>
        <option value="custom_range">Custom Range...</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
};


const Reports = () => {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [timerComplete, setTimerComplete] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const [status, setStatus] = useState(null);
  const [hubStatus, setHubStatus] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [selectedRange, setSelectedRange] = useState("entire_data");
  // customDates now holds the actual dates picked, but doesn't trigger fetch until applyTrigger
  const [customDates, setCustomDates] = useState({ start: null, end: null });

  // StoredDates holds the *applied* custom dates, used for API call
  const [appliedCustomDates, setAppliedCustomDates] = useState({ start: null, end: null });

  const [page, setPage] = useState(1);
  const limit = 10;

  const statusOptions = [
    { value: "Requested", label: "Requested" },
    { value: "Picked-Up", label: "Picked-Up" },
    { value: "In Progress", label: "In Progress" },
    { value: "Delivered", label: "Delivered" },
    { value: "Cancelled", label: "Cancelled" }
  ];

  const hubStatusOptions = [
    { value: "ASSIGNED_TO_PICKUP", label: "Assigned to Pickup" },
    { value: "PICKED_UP", label: "Picked Up" },
    { value: "PROCESSING", label: "Processing" }
  ];

  useEffect(() => {
    if (initialLoad) {
      setTimerComplete(false);
      const t = setTimeout(() => {
        setTimerComplete(true);
        setInitialLoad(false);
      }, MIN_LOAD_TIME);
      return () => clearTimeout(t);
    }
  }, [initialLoad]);

  useEffect(() => {
    if (initialLoad) {
      setIsLoading(!timerComplete);
      return;
    }
    setIsLoading(isFetching);
  }, [isFetching, timerComplete, initialLoad]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  // Function called by the 'Apply' button
  const applyRange = () => {
    if (customDates.start && customDates.end) {
      // FIX: Transfer the dates from temporary state (customDates) to applied state (appliedCustomDates)
      // This is the explicit trigger for the custom range fetch.
      setAppliedCustomDates(customDates);
    }
  };

  const fetchReports = useCallback(async () => {
    setIsFetching(true);
    const token = localStorage.getItem("token");

    // FIX: Use appliedCustomDates for custom range, and customDates for the initial 
    // calculation for non-custom ranges.
    const datesToUse = selectedRange === 'custom_range' ? appliedCustomDates : customDates;
    const { startDate, endDate } = getDateRangeParams(selectedRange, datesToUse);

    // FIX: CRITICAL CHECK
    // If we are in custom range mode, but the applied dates are still null, DO NOT FETCH.
    // This happens immediately after selecting "Custom Range" but before clicking "Apply".
    if (selectedRange === 'custom_range' && (!appliedCustomDates.start || !appliedCustomDates.end)) {
      setIsFetching(false);
      setOrders([]);
      setSummary(null);
      setPagination(null);
      return;
    }

    // If not in custom range, we can fetch immediately (since selectedRange is a dependency)
    // or if in custom range, we rely on appliedCustomDates change.

    const params = new URLSearchParams();
    if (status) params.append("status", status.value);
    if (hubStatus) params.append("hubStatus", hubStatus.value);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (debouncedSearch) params.append("search", debouncedSearch);
    params.append("page", page);
    params.append("limit", limit);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/crm/reports/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      const data = await res.json();
      setOrders(data.data || []);
      setSummary(data.summary || null);
      setPagination(data.meta || null);
    } finally {
      setIsFetching(false);
    }
  }, [status, hubStatus, selectedRange, appliedCustomDates, debouncedSearch, page]); // Only trigger fetch when selectedRange or appliedCustomDates changes

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Reset page on filter/search change
  useEffect(() => {
    setPage(1);
  }, [status, hubStatus, selectedRange, appliedCustomDates, debouncedSearch]);

  const clearFilters = () => {
    setStatus(null);
    setHubStatus(null);
    setSearch("");
    setSelectedRange("entire_data");
    setCustomDates({ start: null, end: null });
    setAppliedCustomDates({ start: null, end: null }); // Clear applied dates too
    setPage(1);
  };

  const buildExportUrl = (type) => {
    const datesToUse = selectedRange === 'custom_range' ? appliedCustomDates : customDates;
    const { startDate, endDate } = getDateRangeParams(selectedRange, datesToUse);

    const params = new URLSearchParams();
    if (status) params.append("status", status.value);
    if (hubStatus) params.append("hubStatus", hubStatus.value);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (debouncedSearch) params.append("search", debouncedSearch);
    params.append("exportType", type);
    return `${import.meta.env.VITE_API_BASE_URL}/api/v1/crm/reports/orders?${params}`;
  };

  const formatExportData = (d) =>
    d.map((o, i) => ({
      sno: i + 1,
      order_id: o.id,
      order_number: o.order_number,
      status: o.status,
      hub_status: o.hubStatus,
      partner: o.partner,
      delivery_date: o.date,
      delivery_time_hours: o.deliveryTime
    }));

  const exportCSV = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(buildExportUrl("csv"), { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    const csv = Papa.unparse(formatExportData(data.data));
    saveAs(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "orders-report.csv");
  };

  const exportXLSX = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(buildExportUrl("xlsx"), { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    const ws = XLSX.utils.json_to_sheet(formatExportData(data.data));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reports");
    XLSX.writeFile(wb, "orders-report.xlsx");
  };

  const isFilterActive = status || hubStatus || search || selectedRange !== "entire_data";

  return (
    <div className="bg-white rounded-2xl shadow-xl border p-6 sm:p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8 pb-2 inline-block">Reports</h1>

      <div className="bg-gray-50 border rounded-xl p-6 mb-8">
        <div className="flex items-center text-xl font-semibold mb-4">
          <Filter className="w-6 h-6 mr-2 text-cyan-600" /> Filter Data
        </div>

        {/* ROW 1: SELECTS, DROPDOWN, CLEAR FILTER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <Select options={statusOptions} value={status} onChange={setStatus} placeholder="Order Status" styles={selectStyles} />

          <Select options={hubStatusOptions} value={hubStatus} onChange={setHubStatus} placeholder="Hub Status" styles={selectStyles} />

          {/* Date Range Dropdown */}
          <DateFilterDropdown
            selectedRange={selectedRange}
            setSelectedRange={setSelectedRange}
            setCustomDates={setCustomDates}
          />

          {/* Clear Filters Button */}
          <button
            disabled={!isFilterActive}
            onClick={clearFilters}
            className={`flex items-center justify-center px-4 py-2 h-11 rounded-lg text-sm font-medium border ${!isFilterActive ? "text-gray-400 bg-gray-100 cursor-not-allowed border-gray-200" : "text-red-600 bg-red-50 hover:bg-red-100 border-red-200 transition duration-150"}`}
          >
            <XCircle className="w-4 h-4 mr-1" /> Clear Filters
          </button>
        </div>

        {/* ROW 2 (CONDITIONAL): CUSTOM DATE PICKERS */}
        {selectedRange === "custom_range" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4 transition-all duration-300 pt-2 border-t border-gray-200">
            {/* Column 1: Start Date */}
            <div className="relative z-40">
              <DatePicker
                selected={customDates.start}
                onChange={(date) => setCustomDates((p) => ({ ...p, start: date }))}
                selectsStart
                startDate={customDates.start}
                endDate={customDates.end}
                placeholderText="Start Date"
                className="border border-gray-300 rounded-lg p-2.5 h-11 text-sm w-full text-center focus:ring-cyan-500 focus:border-cyan-500"
                wrapperClassName="w-full"
                popperClassName="modern-datepicker-popper"
              />
            </div>

            {/* Column 2: End Date */}
            <div className="relative z-40">
              <DatePicker
                selected={customDates.end}
                onChange={(date) => setCustomDates((p) => ({ ...p, end: date }))}
                selectsEnd
                startDate={customDates.start}
                endDate={customDates.end}
                minDate={customDates.start}
                placeholderText="End Date"
                className="border border-gray-300 rounded-lg p-2.5 h-11 text-sm w-full text-center focus:ring-cyan-500 focus:border-cyan-500"
                wrapperClassName="w-full"
                popperClassName="modern-datepicker-popper"
              />
            </div>

            {/* Column 3: Apply Button */}
            <button
              onClick={applyRange}
              // Check if the currently picked dates are valid to enable Apply
              disabled={!customDates.start || !customDates.end}
              className="bg-cyan-600 text-white text-sm font-semibold py-2 px-4 h-11 rounded-lg shadow-md disabled:bg-gray-400 hover:bg-cyan-700 transition duration-150 w-full"
            >
              Apply
            </button>

            {/* Column 4: Empty space for alignment */}
            <div />
          </div>
        )}

        {/* ROW 3: SEARCH AND EXPORT ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-t pt-4 mt-2">

          {/* Search Input */}
          <input
            type="text"
            placeholder="Search by Order ID or Partner..."
            className="w-full border border-gray-300 rounded-lg p-2.5 h-11 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Export Buttons */}
          <div className="flex gap-3 justify-end flex-shrink-0">
            <button onClick={exportCSV} className="flex items-center bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm h-11 hover:bg-cyan-700 shadow-md transition duration-150">
              <Download className="w-4 h-4 mr-1" /> CSV
            </button>

            <button onClick={exportXLSX} className="flex items-center bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm h-11 hover:bg-emerald-700 shadow-md transition duration-150">
              <Download className="w-4 h-4 mr-1" /> XLSX
            </button>
          </div>
        </div>
      </div>

      {isLoading && <ModernSpinner />}

      {!isLoading && (
        <>
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <SummaryCard
                title="Total Orders"
                value={summary.totalOrders || 0}
                color="cyan"
                Icon={ShoppingBagIcon}
                loading={isLoading}
              />
              <SummaryCard
                title="Completed"
                value={summary.completed || 0}
                color="emerald"
                Icon={CheckCircleIcon}
                loading={isLoading}
              />
              <SummaryCard
                title="Avg Delivery Time"
                value={summary.avgDeliveryTime ? `${summary.avgDeliveryTime} hrs` : 'N/A'}
                color="amber"
                Icon={ClockIcon}
                loading={isLoading}
              />
              <SummaryCard
                title="Active Deliveries"
                value={summary.active || 0}
                color="indigo"
                Icon={BoltIcon}
                loading={isLoading}
              />
            </div>
          )}

          <div className="overflow-x-auto border rounded-xl shadow-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={BRAND_BG_CLASS}>
                <tr>
                  {["#", "Order Number", "Status", "Hub Status", "Partner", "Date", "Delivery Time (hrs)"].map((h) => (
                    <th key={h} className={`p-4 text-left text-xs font-bold ${BRAND_COLOR_CLASS} uppercase tracking-wider`}>{h}</th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-10 text-gray-500 text-lg">No orders found.</td>
                  </tr>
                ) : (
                  orders.map((o, i) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-500">{(page - 1) * limit + i + 1}</td>
                      {/* <td className="p-4 text-sm font-medium text-gray-800">{o.id}</td> */}
                      <td className="p-4 text-sm text-gray-800">{o.order_number}</td>
                      <td className="p-4"><StatusBadge status={o.status} /></td>
                      <td className="p-4 text-sm text-gray-800">{o.hubStatus}</td>
                      <td className="p-4 text-sm text-gray-800">{o.partner}</td>
                      <td className="p-4 text-sm text-gray-800">{moment(o.date).format("YYYY-MM-DD")}</td>
                      <td className="p-4 text-sm font-semibold text-gray-800">{o.deliveryTime}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination?.totalPages >= 1 && (
            <div className="flex items-center justify-between mt-8 p-4 bg-gray-50 rounded-xl border">
              <p className="text-sm text-gray-700">
                Showing <span className="font-semibold text-cyan-700">{(page - 1) * limit + 1}</span> to{" "}
                <span className="font-semibold text-cyan-700">{Math.min(page * limit, pagination.total)}</span> of{" "}
                <span className="font-semibold text-cyan-700">{pagination.total}</span>
              </p>

              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1} className="w-10 h-10 flex items-center justify-center rounded-xl border bg-white">
                  <ChevronLeft size={20} />
                </button>

                <span className="text-sm font-semibold">Page {page} of {pagination.totalPages}</span>

                <button onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))} disabled={page >= pagination.totalPages} className="w-10 h-10 flex items-center justify-center rounded-xl border bg-white">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;