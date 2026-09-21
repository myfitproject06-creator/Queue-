import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  RefreshCw,
  Award,
  Users,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Filter,
  BarChart2,
  ListOrdered,
  ArrowUpDown,
  Building2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LabelList,
} from 'recharts';
import { EmployeeHandledStats, HandledTodayStatsResponse } from '../types';

interface ItemsHandledTodayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ItemsHandledTodayModal: React.FC<ItemsHandledTodayModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<HandledTodayStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & display options
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [sortBy, setSortBy] = useState<'handled_desc' | 'handled_asc' | 'name'>('handled_desc');
  const [filterBrand, setFilterBrand] = useState<string>('ALL');
  const [onlyActive, setOnlyActive] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const fetchStats = async (dateStr?: string) => {
    setLoading(true);
    setError(null);
    try {
      const dateToFetch = dateStr || selectedDate;
      const res = await fetch(`/api/stats/handled-today?date=${encodeURIComponent(dateToFetch)}`);
      if (!res.ok) {
        throw new Error('ไม่สามารถโหลดข้อมูลสถิติได้');
      }
      const json: HandledTodayStatsResponse = await res.json();
      setData(json);
    } catch (err: unknown) {
      console.error('Failed to fetch handled stats:', err);
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats(selectedDate);
    }
  }, [isOpen, selectedDate]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // List of distinct brands available
  const availableBrands = useMemo(() => {
    if (!data?.employees) return [];
    const set = new Set<string>();
    data.employees.forEach((e) => {
      if (e.brand) set.add(e.brand);
    });
    return Array.from(set);
  }, [data]);

  // Filtered & sorted employees list
  const processedEmployees = useMemo(() => {
    if (!data?.employees) return [];
    let list = [...data.employees];

    if (onlyActive) {
      list = list.filter((e) => e.handledCount > 0);
    }

    if (filterBrand !== 'ALL') {
      list = list.filter((e) => e.brand === filterBrand);
    }

    list.sort((a, b) => {
      if (sortBy === 'handled_desc') {
        return b.handledCount - a.handledCount;
      }
      if (sortBy === 'handled_asc') {
        return a.handledCount - b.handledCount;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'th');
      }
      return 0;
    });

    return list;
  }, [data, onlyActive, filterBrand, sortBy]);

  // Formatted data for Recharts Bar Chart
  const chartData = useMemo(() => {
    return processedEmployees.map((emp, index) => ({
      id: emp.id,
      name: emp.name,
      shortLabel: emp.nickname ? `${emp.nickname} (${emp.brandCode || 'STAFF'})` : emp.name.split(' ')[0],
      displayName: emp.nickname ? `${emp.name} (${emp.nickname})` : emp.name,
      brand: emp.brand || 'ทั่วไป',
      brandCode: emp.brandCode || '-',
      handledCount: emp.handledCount,
      leftSideCount: emp.leftSideCount,
      rightSideCount: emp.rightSideCount,
      avatarUrl: emp.avatarUrl,
      avatarColor: emp.avatarColor || '#3b82f6',
      rank: index + 1,
    }));
  }, [processedEmployees]);

  if (!isOpen) return null;

  const totalHandled = data?.totalHandled || 0;
  const activeStaffCount = data?.activeEmployeesCount || 0;
  const averagePerStaff =
    data?.employees && data.employees.length > 0
      ? (totalHandled / data.employees.length).toFixed(1)
      : '0';
  const topPerformer = data?.topPerformer;

  // Palette generator for bar chart bars matching elegant dark slate theme
  const getBarColor = (index: number, handledCount: number) => {
    if (handledCount === 0) return '#334155'; // slate-700
    if (index === 0) return '#f59e0b'; // Gold / amber for #1
    if (index === 1) return '#38bdf8'; // Sky blue for #2
    if (index === 2) return '#34d399'; // Emerald for #3
    return '#60a5fa'; // Blue for others
  };

  return (
    <div
      id="handled-today-stats-overlay"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        id="handled-today-stats-dialog"
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-5xl w-full h-[90vh] flex flex-col text-white animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">ยอดบริการสำเร็จประจำวัน (Items Handled Today)</h3>
                <span className="text-xs bg-amber-950/80 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md font-mono font-bold">
                  {selectedDate}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                สรุปจำนวนลูกค้าและรายการที่พนักงานแต่ละคนให้บริการจบคิวในวันนี้
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="stats-refresh-btn"
              onClick={() => fetchStats(selectedDate)}
              disabled={loading}
              title="รีเฟรชข้อมูล"
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
            <button
              id="stats-close-btn"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Top Summary KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Handled */}
            <div
              id="stats-kpi-total-handled"
              className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3.5"
            >
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">ยอดบริการรวมวันนี้</div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {totalHandled} <span className="text-xs font-normal text-slate-400">รายการ</span>
                </div>
              </div>
            </div>

            {/* Top Performer */}
            <div
              id="stats-kpi-top-performer"
              className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3.5"
            >
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-400 font-medium">อันดับ 1 สูงสุดวันนี้</div>
                {topPerformer ? (
                  <div className="truncate">
                    <span className="text-base font-bold text-amber-300">
                      {topPerformer.nickname ? `${topPerformer.nickname} (${topPerformer.brandCode || 'STAFF'})` : topPerformer.name}
                    </span>
                    <span className="text-xs text-slate-300 ml-1.5 font-bold">
                      • {topPerformer.handledCount} รายการ
                    </span>
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-slate-500">- ยังไม่มีข้อมูล -</div>
                )}
              </div>
            </div>

            {/* Active Staff Serving */}
            <div
              id="stats-kpi-active-staff"
              className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3.5"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">พนักงานที่ให้บริการแล้ว</div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {activeStaffCount}{' '}
                  <span className="text-xs font-normal text-slate-400">
                    / {data?.employees?.length || 0} คน
                  </span>
                </div>
              </div>
            </div>

            {/* Average Per Staff */}
            <div
              id="stats-kpi-average-handled"
              className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4 flex items-center gap-3.5"
            >
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">เฉลี่ยต่อพนักงาน</div>
                <div className="text-2xl font-black text-white tracking-tight">
                  {averagePerStaff} <span className="text-xs font-normal text-slate-400">รายการ/คน</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Bar: Filter & View Mode */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
            {/* Left Controls: Date Picker & Brand Filter */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Date selector */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  id="stats-date-input"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-slate-200 outline-none cursor-pointer text-xs"
                />
              </div>

              {/* Brand filter */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <select
                  id="stats-brand-select"
                  value={filterBrand}
                  onChange={(e) => setFilterBrand(e.target.value)}
                  className="bg-transparent text-slate-200 outline-none cursor-pointer text-xs"
                >
                  <option value="ALL" className="bg-slate-900 text-white">ทุกแบรนด์ (All Brands)</option>
                  {availableBrands.map((b) => (
                    <option key={b} value={b} className="bg-slate-900 text-white">
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  id="stats-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'handled_desc' | 'handled_asc' | 'name')}
                  className="bg-transparent text-slate-200 outline-none cursor-pointer text-xs"
                >
                  <option value="handled_desc" className="bg-slate-900 text-white">ยอดสูงสุด ➔ ต่ำสุด</option>
                  <option value="handled_asc" className="bg-slate-900 text-white">ยอดต่ำสุด ➔ สูงสุด</option>
                  <option value="name" className="bg-slate-900 text-white">เรียงตามชื่อพนักงาน</option>
                </select>
              </div>

              {/* Only Active Checkbox */}
              <label
                id="stats-only-active-toggle"
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none bg-slate-900/60 border border-slate-700/60 px-2.5 py-1.5 rounded-xl"
              >
                <input
                  type="checkbox"
                  checked={onlyActive}
                  onChange={(e) => setOnlyActive(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-600 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <span>เฉพาะผู้ที่มีรายการบริการ</span>
              </label>
            </div>

            {/* Right Controls: View Switcher (Chart vs Table) */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700">
              <button
                id="stats-view-chart-btn"
                onClick={() => setViewMode('chart')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'chart'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>กราฟแท่ง</span>
              </button>
              <button
                id="stats-view-table-btn"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>ตารางสรุป</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-rose-950/60 border border-rose-600/50 rounded-2xl text-rose-300 text-sm flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={() => fetchStats(selectedDate)}
                className="text-xs bg-rose-900 hover:bg-rose-800 text-rose-100 px-3 py-1 rounded-lg transition font-bold"
              >
                ลองใหม่
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && !data && (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-sm">กำลังคำนวณและดึงข้อมูลสถิติยอดบริการ...</p>
            </div>
          )}

          {/* Main Visualizer: Bar Chart View */}
          {!loading && viewMode === 'chart' && (
            <div
              id="handled-stats-chart-card"
              className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-bold text-white text-base">แผนภูมิแท่งแสดงยอดบริการต่อพนักงาน</h4>
                  <p className="text-xs text-slate-400">
                    ความสูงของแท่งกราฟแสดงจำนวนรายการบริการที่สำเร็จ (จบคิว) ในวันที่เลือก
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
                    <span>อันดับ 1</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-sky-400 inline-block" />
                    <span>อันดับ 2</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-400 inline-block" />
                    <span>อันดับ 3</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-400 inline-block" />
                    <span>อันดับทั่วไป</span>
                  </div>
                </div>
              </div>

              {chartData.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <p className="text-sm">ไม่พบข้อมูลพนักงานที่ตรงกับเงื่อนไขการค้นหา</p>
                </div>
              ) : (
                <div className="w-full h-80 sm:h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#334155"
                        vertical={false}
                        opacity={0.6}
                      />
                      <XAxis
                        dataKey="shortLabel"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#475569' }}
                        interval={0}
                        angle={-30}
                        textAnchor="end"
                        height={55}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#475569' }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(51, 65, 85, 0.4)' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const p = payload[0].payload;
                            return (
                              <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1.5 max-w-xs">
                                <div className="flex items-center gap-2 font-bold text-white border-b border-slate-800 pb-1.5">
                                  {p.avatarUrl ? (
                                    <img
                                      src={p.avatarUrl}
                                      alt={p.name}
                                      className="w-6 h-6 rounded-full object-cover border border-slate-600"
                                    />
                                  ) : (
                                    <div
                                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-[10px]"
                                      style={{ backgroundColor: p.avatarColor }}
                                    >
                                      {p.name.charAt(0)}
                                    </div>
                                  )}
                                  <span>{p.displayName}</span>
                                  {p.brandCode && (
                                    <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-500/40 px-1 py-0.2 rounded font-mono">
                                      {p.brandCode}
                                    </span>
                                  )}
                                </div>
                                <div className="flex justify-between items-center text-slate-300 pt-1">
                                  <span>ยอดบริการสำเร็จ:</span>
                                  <span className="text-amber-400 font-black text-sm">
                                    {p.handledCount} รายการ
                                  </span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                                  <span>แบรนด์สังกัด:</span>
                                  <span className="text-slate-300">{p.brand}</span>
                                </div>
                                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                                  <span>แยกตามฝั่ง:</span>
                                  <span className="text-slate-300">
                                    LEFT: {p.leftSideCount} | RIGHT: {p.rightSideCount}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar
                        dataKey="handledCount"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      >
                        <LabelList
                          dataKey="handledCount"
                          position="top"
                          fill="#f8fafc"
                          fontSize={12}
                          fontWeight="bold"
                          formatter={(val: any) => (Number(val) > 0 ? Number(val) : '')}
                        />
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${entry.id}`}
                            fill={getBarColor(index, entry.handledCount)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Table / Detail View */}
          {!loading && viewMode === 'table' && (
            <div
              id="handled-stats-table-card"
              className="bg-slate-800/40 border border-slate-700/80 rounded-2xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">อันดับ</th>
                      <th className="py-3 px-4">พนักงาน</th>
                      <th className="py-3 px-4">แบรนด์ / รหัส</th>
                      <th className="py-3 px-4 text-center">ฝั่ง LEFT</th>
                      <th className="py-3 px-4 text-center">ฝั่ง RIGHT</th>
                      <th className="py-3 px-4 text-right">ยอดรวมบริการ</th>
                      <th className="py-3 px-4 text-right">สัดส่วน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {processedEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-500">
                          ไม่พบข้อมูลพนักงานที่ตรงกับเงื่อนไข
                        </td>
                      </tr>
                    ) : (
                      processedEmployees.map((emp, index) => {
                        const percentage =
                          totalHandled > 0
                            ? ((emp.handledCount / totalHandled) * 100).toFixed(1)
                            : '0';
                        return (
                          <tr
                            key={emp.id}
                            className={`hover:bg-slate-800/50 transition ${
                              index === 0 && emp.handledCount > 0 ? 'bg-amber-950/20' : ''
                            }`}
                          >
                            <td className="py-3 px-4 text-center font-bold">
                              {index === 0 && emp.handledCount > 0 ? (
                                <span className="text-amber-400 flex items-center justify-center">🥇</span>
                              ) : index === 1 && emp.handledCount > 0 ? (
                                <span className="text-slate-300 flex items-center justify-center">🥈</span>
                              ) : index === 2 && emp.handledCount > 0 ? (
                                <span className="text-amber-600 flex items-center justify-center">🥉</span>
                              ) : (
                                <span className="text-slate-500 text-xs">{index + 1}</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                {emp.avatarUrl ? (
                                  <img
                                    src={emp.avatarUrl}
                                    alt={emp.name}
                                    className="w-8 h-8 rounded-full object-cover border border-slate-700 flex-shrink-0"
                                  />
                                ) : (
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                                    style={{ backgroundColor: emp.avatarColor || '#3b82f6' }}
                                  >
                                    {emp.name.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-white flex items-center gap-1.5">
                                    <span>{emp.name}</span>
                                    {emp.nickname && (
                                      <span className="text-xs text-amber-300 font-bold bg-slate-800 px-1.5 py-0.2 rounded border border-slate-700">
                                        ({emp.nickname})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs text-slate-300">{emp.brand || '-'}</span>
                                {emp.brandCode && (
                                  <span className="text-[10px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-500/40 px-1.5 py-0.2 rounded">
                                    {emp.brandCode}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                              {emp.leftSideCount}
                            </td>
                            <td className="py-3 px-4 text-center text-slate-400 font-mono text-xs">
                              {emp.rightSideCount}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <span
                                className={`font-mono font-bold text-base ${
                                  emp.handledCount > 0 ? 'text-amber-400' : 'text-slate-500'
                                }`}
                              >
                                {emp.handledCount}
                              </span>
                              <span className="text-xs text-slate-400 ml-1">รายการ</span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 bg-slate-800 rounded-full h-2 overflow-hidden hidden sm:block">
                                  <div
                                    className="bg-amber-500 h-2 rounded-full"
                                    style={{ width: `${Math.min(100, Number(percentage))}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-400 font-mono w-10 text-right">
                                  {percentage}%
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between flex-shrink-0 text-xs text-slate-400">
          <div>
            <span>ข้อมูลสถิติอัปเดตแบบเรียลไทม์จากระบบจัดคิว PAINT QUEUE</span>
          </div>
          <button
            id="stats-footer-close-btn"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
