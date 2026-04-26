import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Truck, Users, Clock, Loader2, CalendarDays, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import dayjs from "dayjs";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const MIN_LOAD_TIME = 500;
const LIMIT = 10;

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
    default:
      startDate = null;
      endDate = null;
  }

  return { startDate, endDate };
};

const ModernSpinner = ({ size = "w-10 h-10", color = "border-cyan-600" }) => (
  <div className="flex justify-center items-center py-12">
    <div className={`${size} border-4 ${color} border-t-transparent rounded-full animate-spin`} />
  </div>
);

const SummaryCard = ({ title, value, detail, Icon, colorClass, detailIcon: DetailIcon }) => (
  <div className={`${colorClass} rounded-2xl p-5 flex items-center justify-between shadow-xl transition duration-300 transform hover:scale-[1.02]`}>
    <div className="flex flex-col items-start">
      <p className="text-3xl font-extrabold text-white">{value}</p>
      <p className="text-sm font-semibold text-white mt-0.5 opacity-90">{title}</p>
      {detail && (
        <p className="text-xs text-white/80 mt-2 flex items-center">
          {DetailIcon && <DetailIcon className="w-3 h-3 mr-1" />}
          {detail}
        </p>
      )}
    </div>
    <div className="p-1 rounded-full bg-transparent flex-shrink-0">
      <Icon className="w-10 h-10 text-gray-900/50" />
    </div>
  </div>
);

const DateFilterDropdown = ({ selectedRange, setSelectedRange, setCustomDates }) => {
  const handleRangeChange = (e) => {
    const v = e.target.value;
    setSelectedRange(v);
    if (v !== "custom_range") setCustomDates({ start: null, end: null });
  };

  return (
    <div className="relative inline-flex items-center bg-white border border-gray-300 rounded-lg shadow-sm p-2 h-11 w-full flex-shrink-0">
      <CalendarDays className="w-5 h-5 text-cyan-600 mr-2 flex-shrink-0" />
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
        <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
};

const Delivery = () => {
  const [filters, setFilters] = useState({ partner: "", shift: "" });
  const [orders, setOrders] = useState([]);
  const [shiftConfig, setShiftConfig] = useState([]);
  const [partners, setPartners] = useState([]);
  const [pagination, setPagination] = useState(null);

  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [timerComplete, setTimerComplete] = useState(false);

  const [selectedRange, setSelectedRange] = useState("entire_data");
  const [customDates, setCustomDates] = useState({ start: null, end: null });
  const [appliedCustomDates, setAppliedCustomDates] = useState({ start: null, end: null });

  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setTimerComplete(true), MIN_LOAD_TIME);
    return () => clearTimeout(t);
  }, []);

  const applyRange = () => {
    if (customDates.start && customDates.end) {
      setAppliedCustomDates(customDates);
      setPage(1);
    }
  };

  const fetchOrders = useCallback(async () => {
    setIsFetching(true);

    const { startDate, endDate } = getDateRangeParams(selectedRange, appliedCustomDates);

    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (filters.partner) params.append("partner", filters.partner);
    if (filters.shift) params.append("shift", filters.shift);
    params.append("page", page);
    params.append("limit", LIMIT);

    const url = `${import.meta.env.VITE_API_BASE_URL}/api/v1/crm/delivery/orders?${params.toString()}`;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

      if (res.status === 403) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      const data = await res.json();
      if (!data?.status) return;

      setOrders(data.data.orders || []);
      setShiftConfig(data.data.shifts || []);
      setPartners(data.data.partners || []);
      setPagination(data.pagination || null);
    } finally {
      setIsFetching(false);
    }
  }, [selectedRange, appliedCustomDates, filters.partner, filters.shift, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [selectedRange, appliedCustomDates, filters.partner, filters.shift]);

  useEffect(() => {
    if (!isFetching && timerComplete) setLoading(false);
    else setLoading(true);
  }, [isFetching, timerComplete]);

  const shiftSummary = useMemo(() => {
    return shiftConfig.map((shift) => {
      const shiftOrders = orders.filter((o) => o.shift === shift.name);
      const uniquePartners = [...new Set(shiftOrders.map((o) => o.partner))];

      return {
        shift: shift.name,
        time: `${shift.start} - ${shift.end}`,
        count: shiftOrders.length,
        partners: uniquePartners,
        color:
          shift.name === "Morning"
            ? "bg-cyan-600"
            : shift.name === "Evening"
              ? "bg-indigo-600"
              : "bg-emerald-600",
      };
    });
  }, [orders, shiftConfig]);

  const totalOrders = pagination?.total || 0;
  const totalPartners = partners.length;

  if (loading) return <ModernSpinner />;

  const isFilterActive =
    filters.partner || filters.shift || selectedRange !== "entire_data";

  return (
    <div className="p-1 sm:p-2">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 pb-1 inline-block">
          Daily Delivery Overview
        </h1>
        <p className="text-gray-500 mt-1">Deliveries scheduled for the selected period. Total {totalOrders} orders across {totalPartners} partners.</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-8 p-4 bg-white rounded-xl shadow-inner border border-gray-100">
        <span className="text-sm font-semibold text-gray-700 mr-2 flex-shrink-0">Filter by:</span>

        <div className="w-full sm:w-auto flex-grow max-w-xs">
          <DateFilterDropdown selectedRange={selectedRange} setSelectedRange={setSelectedRange} setCustomDates={setCustomDates} />
        </div>

        <select
          className="border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg cursor-pointer shadow-sm w-full sm:w-auto"
          value={filters.partner}
          onChange={(e) => setFilters({ ...filters, partner: e.target.value })}
        >
          <option value="">All Partners ({partners.length})</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>


        <select
          className="border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-lg cursor-pointer shadow-sm w-full sm:w-auto"
          value={filters.shift}
          onChange={(e) => setFilters({ ...filters, shift: e.target.value })}
        >
          <option value="">All Shifts ({shiftConfig.length})</option>
          {shiftConfig.map((shift) => (
            <option key={shift.name} value={shift.name}>{shift.name}</option>
          ))}
        </select>

        {isFilterActive && (
          <button
            onClick={() => {
              setFilters({ partner: "", shift: "" });
              setSelectedRange("entire_data");
              setCustomDates({ start: null, end: null });
              setAppliedCustomDates({ start: null, end: null });
              setPage(1);
            }}
            className="px-4 py-2 text-sm font-semibold bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center shadow-sm w-full sm:w-auto"
          >
            <XCircle className="w-4 h-4 mr-1" /> Reset All
          </button>
        )}
      </div>

      {selectedRange === "custom_range" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4 p-4 border border-cyan-100 bg-cyan-50 rounded-xl">
          <span className="text-sm font-semibold text-cyan-800 self-center hidden lg:block">Custom Range:</span>

          <DatePicker
            selected={customDates.start}
            onChange={(date) => setCustomDates((p) => ({ ...p, start: date }))}
            selectsStart
            startDate={customDates.start}
            endDate={customDates.end}
            placeholderText="Start Date"
            className="border border-cyan-300 rounded-lg p-2.5 h-11 text-sm w-full text-center"
            wrapperClassName="w-full"
          />

          <DatePicker
            selected={customDates.end}
            onChange={(date) => setCustomDates((p) => ({ ...p, end: date }))}
            selectsEnd
            startDate={customDates.start}
            endDate={customDates.end}
            minDate={customDates.start}
            placeholderText="End Date"
            className="border border-cyan-300 rounded-lg p-2.5 h-11 text-sm w-full text-center"
            wrapperClassName="w-full"
          />

          <button
            onClick={applyRange}
            disabled={!customDates.start || !customDates.end}
            className="bg-cyan-600 text-white text-sm font-semibold py-2 px-4 h-11 rounded-lg shadow-md disabled:bg-gray-400 hover:bg-cyan-700 w-full"
          >
            Apply Date Range
          </button>

          <div className="hidden md:block" />
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {shiftSummary.map((s) => (
          <div
            key={s.shift}
            className="bg-white rounded-2xl p-6 flex flex-col justify-between border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  {s.shift} Shift
                </p>
                <p className="text-3xl font-black text-gray-900 tracking-tight">
                  {s.count}
                </p>
              </div>
              {/* Dynamic Icon Accent */}
              <div className={`p-3 rounded-xl bg-gray-50 text-gray-600`}>
                <Clock className="w-6 h-6" />
              </div>
            </div>

            <div className="flex items-center pt-4 border-t border-gray-50">
              <div className="p-1.5 bg-cyan-50 text-cyan-600 rounded-lg mr-3">
                <Users className="w-4 h-4" />
              </div>
              <p className="text-sm font-bold text-gray-600">
                {s.partners.length} <span className="text-gray-400 font-medium">Partners</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-4 lg:p-6 rounded-xl shadow-md border border-gray-200 mb-10 flex flex-wrap justify-between items-center space-y-3 lg:space-y-0">
        <div className="w-full lg:w-auto text-lg font-bold text-gray-800 flex items-center">
          <span className="p-2 mr-3 bg-cyan-100 rounded-full text-cyan-600">
            <Truck className="w-6 h-6" />
          </span>
          Filtered Delivery Metrics
        </div>

        <div className="flex flex-wrap gap-6 sm:gap-10 w-full lg:w-auto justify-end">
          <div>
            <span className="text-3xl font-extrabold text-cyan-600">
              {pagination?.total || 0}
            </span>
            <span className="text-sm text-gray-500 font-medium mt-[-4px] block">
              Total Orders (Overall)
            </span>
          </div>

          <div>
            <span className="text-3xl font-extrabold text-indigo-600">
              {partners.length}
            </span>
            <span className="text-sm text-gray-500 font-medium mt-[-4px] block">
              Unique Partners (Overall)
            </span>
          </div>

          <div>
            <span className="text-3xl font-extrabold text-emerald-600">
              {partners.length === 0 ? 0 : (pagination.total / partners.length).toFixed(1)}
            </span>
            <span className="text-sm text-gray-500 font-medium mt-[-4px] block">
              Orders / Partner (Overall)
            </span>
          </div>
        </div>
      </div>


      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No deliveries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-cyan-50">
                <tr>
                  {["Order ID", "Customer", "Partner", "Delivery Time", "Shift", "Status"].map((col) => (
                    <th key={col} className="py-3 px-6 text-left text-xs font-bold text-cyan-700 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="py-3 px-6 text-sm font-semibold">{order.order_number}</td>
                    <td className="py-3 px-6 text-sm">{order.customer}</td>
                    <td className="py-3 px-6 text-sm">{order.partner}</td>
                    <td className="py-3 px-6 text-sm">{order.deliveryTime}</td>
                    <td className="py-3 px-6 text-sm">{order.shift}</td>
                    <td className="py-3 px-6 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${order.status === "Delivered" ? "bg-green-100 text-green-800" : order.status === "Cancelled" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination?.totalPages >= 1 && (
        <div className="flex items-center justify-between mt-8 p-4 bg-gray-50 rounded-xl border">
          <p className="text-sm text-gray-700">
            Showing <span className="font-semibold text-cyan-700">{(page - 1) * LIMIT + 1}</span> to{" "}
            <span className="font-semibold text-cyan-700">{Math.min(page * LIMIT, pagination.total)}</span> of{" "}
            <span className="font-semibold text-cyan-700">{pagination.total}</span> deliveries
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
    </div>
  );
};

export default Delivery;
