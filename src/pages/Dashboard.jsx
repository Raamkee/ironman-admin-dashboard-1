import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  BoltIcon,
  CheckCircleIcon,
  ClockIcon,
  ShoppingBagIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import dayjs from "dayjs";

const VIBRANT_COLORS = ["#06B6D4", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#3B82F6"];

// --- 1. LOGIC HELPERS ---

const getDateRangeParams = (range, customDates) => {
  const today = dayjs();
  let startDate = null;
  let endDate = today.format('YYYY-MM-DD');

  switch (range) {
    case "today": startDate = today.format('YYYY-MM-DD'); break;
    case "yesterday":
      startDate = today.subtract(1, "day").format('YYYY-MM-DD');
      endDate = startDate;
      break;
    case "last_7_days": startDate = today.subtract(7, "day").format('YYYY-MM-DD'); break;
    case "this_month": startDate = today.startOf("month").format('YYYY-MM-DD'); break;
    case "last_month":
      startDate = today.subtract(1, "month").startOf("month").format('YYYY-MM-DD');
      endDate = today.subtract(1, "month").endOf("month").format('YYYY-MM-DD');
      break;
    case "custom_range":
      startDate = customDates.start ? dayjs(customDates.start).format('YYYY-MM-DD') : null;
      endDate = customDates.end ? dayjs(customDates.end).format('YYYY-MM-DD') : null;
      break;
    default: startDate = null; endDate = null;
  }
  return { startDate, endDate };
};

// --- 2. SUB-COMPONENTS ---

const DateFilter = ({ selectedRange, setSelectedRange, customDates, setCustomDates, handleApplyCustomRange }) => {
  const [showCustomPicker, setShowCustomPicker] = useState(selectedRange === 'custom_range');

  const handleRangeChange = (e) => {
    const newRange = e.target.value;
    setSelectedRange(newRange);
    setShowCustomPicker(newRange === 'custom_range');
    if (newRange !== 'custom_range') setCustomDates({ start: null, end: null });
  };

  // RESTORED: Clear Filter Logic
  const handleClear = (e) => {
    e.preventDefault();
    setSelectedRange("entire_data");
    setCustomDates({ start: null, end: null });
    setShowCustomPicker(false);
  };

  return (
    <div className="flex flex-col items-end space-y-2 relative z-50">
      <div className="flex flex-col sm:flex-row items-end sm:items-center space-x-0 sm:space-x-3 space-y-3 sm:space-y-0">

        {/* RESTORED: Clear Filter Button */}
        {selectedRange !== "entire_data" && (
          <button
            onClick={handleClear}
            className="text-sm font-bold text-cyan-600 hover:text-cyan-800 underline decoration-cyan-300 underline-offset-4 transition-colors mb-2 sm:mb-0"
          >
            Clear Filter
          </button>
        )}

        <div className="relative inline-flex items-center bg-white border border-gray-200 rounded-xl shadow-sm h-11 px-3">
          <CalendarDaysIcon className="w-5 h-5 text-cyan-600 mr-2" />
          <select value={selectedRange} onChange={handleRangeChange} className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer pr-4">
            <option value="entire_data">All Time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="custom_range">Custom Range...</option>
          </select>
        </div>

        {showCustomPicker && (
          <div className="flex items-center space-x-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
            <DatePicker selected={customDates.start} onChange={(d) => setCustomDates(p => ({ ...p, start: d }))} placeholderText="Start" className="w-24 text-xs text-center border-none focus:ring-0" />
            <span className="text-gray-400">-</span>
            <DatePicker selected={customDates.end} onChange={(d) => setCustomDates(p => ({ ...p, end: d }))} placeholderText="End" className="w-24 text-xs text-center border-none focus:ring-0" />
            <button onClick={handleApplyCustomRange} className="bg-cyan-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-cyan-700">Apply</button>
          </div>
        )}
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, colorClass, Icon, isLoading }) => {
  const colorMap = {
    "bg-cyan-500": "text-cyan-600 bg-cyan-50",
    "bg-emerald-500": "text-emerald-600 bg-emerald-50",
    "bg-amber-500": "text-amber-600 bg-amber-50",
    "bg-indigo-500": "text-indigo-600 bg-indigo-50",
    "bg-green-600": "text-green-600 bg-green-50"
  };
  const theme = colorMap[colorClass] || "text-gray-600 bg-gray-50";

  return (
    <div className="bg-white rounded-2xl p-6 flex items-center justify-between border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 h-full">
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        {isLoading ? <div className="h-8 w-20 bg-gray-100 animate-pulse rounded" /> : <p className="text-3xl font-black text-gray-900">{value}</p>}
      </div>
      <div className={`p-3 rounded-xl ${theme}`}>
        <Icon className="w-8 h-8" />
      </div>
    </div>
  );
};

const ChartCard = ({ title, children, isLoading, isEmpty, extraHeader }) => (
  <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100 h-full">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <h2 className="text-xl font-black text-gray-800 tracking-tight border-l-4 border-cyan-500 pl-4">{title}</h2>
      {extraHeader}
    </div>
    {isLoading ? (
      <div className="flex justify-center items-center py-20"><div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>
    ) : isEmpty ? (
      <div className="text-center py-20 text-gray-400 font-medium">No data available</div>
    ) : children}
  </div>
);

// --- 3. MAIN DASHBOARD ---

const Dashboard = () => {
  const [selectedRange, setSelectedRange] = useState("entire_data");
  const [customDates, setCustomDates] = useState({ start: null, end: null });
  const [applyTrigger, setApplyTrigger] = useState(0);

  const [summary, setSummary] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [avgDeliveryData, setAvgDeliveryData] = useState([]);
  const [stageSummary, setStageSummary] = useState([]);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingBreakdown, setLoadingBreakdown] = useState(true);
  const [loadingAvg, setLoadingAvg] = useState(true);
  const [loadingStage, setLoadingStage] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    const { startDate, endDate } = getDateRangeParams(selectedRange, customDates);
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('start_date', startDate);
    if (endDate) queryParams.append('end_date', endDate);
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';

    // If custom range is selected but dates aren't set, don't fetch yet
    if (selectedRange === 'custom_range' && (!startDate || !endDate)) {
      setLoadingSummary(false); setLoadingBreakdown(false); setLoadingAvg(false); setLoadingStage(false);
      return;
    }

    const fetchData = async (endpoint, setter, loadingSetter, mapData = (d) => d) => {
      loadingSetter(true);
      try {
        const res = await fetch(`${BASE_URL}/api/v1/crm/dashboard/${endpoint}${query}`, { method: "GET", headers: authHeaders });
        console.log(`Fetched ${endpoint} with status:`, res.status);
        if (res.status === 403) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        const result = await res.json();
        if (result?.status) setter(mapData(result.data));
      } catch (err) { console.error(`Error fetching ${endpoint}:`, err); }
      finally { loadingSetter(false); }
    };

    fetchData('summary', setSummary, setLoadingSummary, (d) => ([
      { title: "Total Orders", value: d.total_orders, colorClass: "bg-cyan-500", Icon: ShoppingBagIcon },
      { title: "Completed", value: d.completed_orders, colorClass: "bg-emerald-500", Icon: CheckCircleIcon },
      { title: "Avg Delivery Time", value: `${d.avg_delivery_time} mins`, colorClass: "bg-indigo-500", Icon: ClockIcon },
      { title: "Active Pickups", value: d.active_pickups, colorClass: "bg-amber-500", Icon: BoltIcon },
    ]));
    fetchData('breakdown', setBreakdown, setLoadingBreakdown);
    fetchData('avg-delivery', setAvgDeliveryData, setLoadingAvg);
    fetchData('stages', setStageSummary, setLoadingStage, (data) =>
      Array.isArray(data) ? data.map(item => ({ stage: item.status, orders: item.orders, percent: item.percent, avg: parseFloat(item.avg_time) })) : []
    );
  }, [selectedRange, applyTrigger]);

  const formatStageLabel = (s) => s?.replace(/[_-]/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) || "";
  const totalOrders = Number(summary.find(s => s.title === "Total Orders")?.value) || 0;
  const completedOrders = Number(summary.find(s => s.title === "Completed")?.value) || 0;
  const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0;

  return (
    <div className="bg-gray-50/50 min-h-screen p-6 lg:p-10">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Analytics Dashboard</h1>
            <p className="text-gray-500 text-sm">Real-time delivery performance tracking.</p>
          </div>
          <DateFilter
            selectedRange={selectedRange}
            setSelectedRange={setSelectedRange}
            customDates={customDates}
            setCustomDates={setCustomDates}
            handleApplyCustomRange={() => setApplyTrigger(t => t + 1)}
          />
        </div>

        {/* BLOCK 1: STATUS PIE & VOLUME CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-1">
            <ChartCard title="Order Status" isLoading={loadingBreakdown} isEmpty={breakdown.length === 0}>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdown} cx="50%" cy="50%" innerRadius={70} outerRadius={95} paddingAngle={8} dataKey="value">
                      {breakdown.map((_, i) => <Cell key={i} fill={VIBRANT_COLORS[i % VIBRANT_COLORS.length]} cornerRadius={6} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {breakdown.map((item, i) => (
                  <div key={i} className="flex items-center text-[10px] font-bold text-gray-400 uppercase">
                    <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: VIBRANT_COLORS[i % VIBRANT_COLORS.length] }} />
                    {formatStageLabel(item.name)}
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {summary.filter(s => s.title !== "Avg Delivery Time").map((item, i) => (
              <SummaryCard key={i} {...item} isLoading={loadingSummary} />
            ))}
            <SummaryCard title="Completion Rate" value={`${completionRate}%`} colorClass="bg-green-600" Icon={CheckCircleIcon} isLoading={loadingSummary} />
          </div>
        </div>

        {/* BLOCK 2: TREND AREA CHART & AVG TIME HERO */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          <ChartCard
            title="Delivery Trend"
            isLoading={loadingAvg}
            isEmpty={avgDeliveryData.length === 0}
            extraHeader={
              <div className="flex items-center bg-gray-50 px-5 py-2 rounded-2xl border border-gray-100">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg mr-4"><ClockIcon className="w-5 h-5" /></div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Avg</p>
                  <p className="text-xl font-black text-gray-800">{summary.find(s => s.title === "Avg Delivery Time")?.value || "0 mins"}</p>
                </div>
              </div>
            }
          >
            <div className="h-80 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={avgDeliveryData}>
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.15} /><stop offset="95%" stopColor="#06B6D4" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }} />
                  <Area type="monotone" dataKey="avgTime" stroke="#06B6D4" strokeWidth={4} fill="url(#trendGradient)" dot={{ r: 4, fill: "#06B6D4", strokeWidth: 2, stroke: "#fff" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* TABLE SECTION */}
        <ChartCard title="Stage Analysis Table" isLoading={loadingStage} isEmpty={stageSummary.length === 0}>
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="py-4 px-6">Stage</th><th className="py-4 px-6">Orders</th><th className="py-4 px-6">Success %</th><th className="py-4 px-6">Avg (Hrs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {stageSummary.map((row, i) => (
                  <tr key={i} className="hover:bg-cyan-50/50 transition duration-150">
                    <td className="py-4 px-6 text-sm font-bold text-gray-700">{formatStageLabel(row.stage)}</td>
                    <td className="py-4 px-6 text-sm text-gray-600">{row.orders}</td>
                    <td className="py-4 px-6"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold">{row.percent}%</span></td>
                    <td className="py-4 px-6 text-sm font-mono text-cyan-600">{row.avg.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;