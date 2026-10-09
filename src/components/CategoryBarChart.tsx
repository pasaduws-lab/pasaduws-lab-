import React, { useState, useMemo } from 'react';
import { AssetItem, CATEGORY_OPTIONS, AssetCategory } from '../types/asset';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  Coins,
  Layers,
  TrendingUp,
  Award,
  Package,
} from 'lucide-react';

interface CategoryBarChartProps {
  assets: AssetItem[];
}

// Distinct theme colors for the 11 asset categories
const CATEGORY_COLORS: Record<AssetCategory, string> = {
  'ครุภัณฑ์สำนักงาน': '#2563eb', // Blue
  'ครุภัณฑ์ยานพาหนะและขนส่ง': '#d97706', // Amber
  'ครุภัณฑ์ไฟฟ้าและวิทยุ': '#0891b2', // Cyan
  'ครุภัณฑ์โฆษณาและเผยแพร่': '#7c3aed', // Purple
  'ครุภัณฑ์การเกษตร': '#059669', // Emerald
  'ครุภัณฑ์ก่อสร้าง': '#ea580c', // Orange
  'ครุภัณฑ์สำรวจ': '#0d9488', // Teal
  'ครุภัณฑ์คอมพิวเตอร์': '#4f46e5', // Indigo
  'ครุภัณฑ์งานบ้านงานครัว': '#e11d48', // Rose
  'ครุภัณฑ์กีฬา': '#0284c7', // Sky
  'ครุภัณฑ์อื่น': '#64748b', // Slate
};

export const CategoryBarChart: React.FC<CategoryBarChartProps> = ({ assets }) => {
  const [metricMode, setMetricMode] = useState<'count' | 'value'>('count');
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');

  // Compute statistics per category
  const chartData = useMemo(() => {
    return CATEGORY_OPTIONS.map((cat) => {
      const items = assets.filter((item) => {
        if (cat === 'ครุภัณฑ์อื่น') {
          return (
            item.category === 'ครุภัณฑ์อื่น' ||
            (item.category && !CATEGORY_OPTIONS.includes(item.category))
          );
        }
        return item.category === cat;
      });

      const count = items.length;
      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
      const totalValue = items.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
        0
      );

      return {
        category: cat,
        shortName: cat.replace('ครุภัณฑ์', ''), // For cleaner X-Axis labels
        count,
        totalQuantity,
        totalValue,
        color: CATEGORY_COLORS[cat] || '#64748b',
      };
    });
  }, [assets]);

  // Overall totals
  const totalAssetsCount = assets.length;
  const totalAssetsValue = useMemo(() => {
    return assets.reduce((sum, a) => sum + (a.price || 0) * (a.quantity || 1), 0);
  }, [assets]);

  // Top category by count & value for insights
  const topByCategoryCount = useMemo(() => {
    return [...chartData].sort((a, b) => b.count - a.count)[0];
  }, [chartData]);

  const topByCategoryValue = useMemo(() => {
    return [...chartData].sort((a, b) => b.totalValue - a.totalValue)[0];
  }, [chartData]);

  // Filter out zero-count items for Pie Chart to avoid clutter
  const pieData = useMemo(() => {
    return chartData.filter((item) =>
      metricMode === 'count' ? item.count > 0 : item.totalValue > 0
    );
  }, [chartData, metricMode]);

  // Custom Tooltip component for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      const countPct =
        totalAssetsCount > 0 ? ((data.count / totalAssetsCount) * 100).toFixed(1) : '0';
      const valuePct =
        totalAssetsValue > 0
          ? ((data.totalValue / totalAssetsValue) * 100).toFixed(1)
          : '0';

      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs backdrop-blur-xs min-w-[220px]">
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-800">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <p className="font-bold text-sm text-slate-100">{data.category}</p>
          </div>

          <div className="space-y-1.5 font-medium">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">จำนวนรายการ:</span>
              <span className="font-mono font-bold text-slate-100">
                {data.count.toLocaleString('th-TH')} รายการ ({countPct}%)
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">จำนวนหน่วย:</span>
              <span className="font-mono text-slate-200">
                {data.totalQuantity.toLocaleString('th-TH')} หน่วย
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">มูลค่ารวม:</span>
              <span className="font-mono font-bold text-amber-300">
                ฿{data.totalValue.toLocaleString('th-TH')} บาท ({valuePct}%)
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6 space-y-5">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-900 border border-blue-100">
              <BarChart3 className="w-5 h-5 text-blue-800" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>สถิติจำนวนครุภัณฑ์แยกตามประเภท</span>
                <span className="text-xs font-normal text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Recharts
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                องค์การบริหารส่วนตำบลวังซ้าย • สัดส่วนรายการและงบประมาณตามหมวดหมู่ทรัพย์สิน
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Metric Mode & Chart Type */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Chart Type Toggle (Bar vs Pie) */}
          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                chartType === 'bar'
                  ? 'bg-white text-blue-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="แสดงแบบกราฟแท่ง"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>กราฟแท่ง</span>
            </button>
            <button
              type="button"
              onClick={() => setChartType('pie')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                chartType === 'pie'
                  ? 'bg-white text-blue-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="แสดงแบบแผนภูมิวงกลม"
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>แผนภูมิวงกลม</span>
            </button>
          </div>

          {/* Metric Toggle (Count vs Monetary Value) */}
          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMetricMode('count')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                metricMode === 'count'
                  ? 'bg-blue-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="ดูจำนวนรายการ"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>จำนวนรายการ</span>
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('value')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                metricMode === 'value'
                  ? 'bg-blue-700 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="ดูมูลค่ารวม (บาท)"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>มูลค่ารวม (บาท)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Insights Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="flex items-center gap-3 p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
          <div className="p-2 rounded-lg bg-blue-100 text-blue-800 shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-blue-800 font-semibold block">
              ประเภทที่มีจำนวนรายการมากที่สุด
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {topByCategoryCount?.category || '-'}{' '}
              <span className="text-blue-700 font-mono">
                ({topByCategoryCount?.count.toLocaleString('th-TH')} รายการ)
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] text-emerald-800 font-semibold block">
              ประเภทที่มีมูลค่ารวมสูงสุด
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {topByCategoryValue?.category || '-'}{' '}
              <span className="text-emerald-700 font-mono font-bold">
                (฿{topByCategoryValue?.totalValue.toLocaleString('th-TH')})
              </span>
            </p>
          </div>
        </div>

        <div className="sm:col-span-2 lg:col-span-1 flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="p-2 rounded-lg bg-slate-200/70 text-slate-700 shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block">
              รวมทรัพย์สินทั้งหมดในสังกัด
            </span>
            <p className="text-xs sm:text-sm font-bold text-slate-900">
              <span className="font-mono text-blue-900 font-bold">
                {totalAssetsCount.toLocaleString('th-TH')}
              </span>{' '}
              รายการ •{' '}
              <span className="font-mono text-emerald-700 font-bold">
                ฿{totalAssetsValue.toLocaleString('th-TH')}
              </span>{' '}
              บาท
            </p>
          </div>
        </div>
      </div>

      {/* 3. Recharts Visual Area */}
      <div className="w-full pt-2">
        {chartType === 'bar' ? (
          <div className="w-full h-[360px] sm:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 20, left: 10, bottom: 65 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="category"
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                  tick={{ fontSize: 11, fill: '#334155', fontFamily: 'Sarabun, sans-serif' }}
                  height={75}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Sarabun, sans-serif' }}
                  tickFormatter={(val) =>
                    metricMode === 'count'
                      ? val.toLocaleString('th-TH')
                      : val >= 1000000
                      ? `${(val / 1000000).toFixed(1)}M`
                      : val >= 1000
                      ? `${(val / 1000).toFixed(0)}k`
                      : val.toLocaleString('th-TH')
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey={metricMode === 'count' ? 'count' : 'totalValue'}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.category} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Pie Chart */}
            <div className="md:col-span-7 h-[340px] sm:h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomTooltip />} />
                  <Pie
                    data={pieData}
                    dataKey={metricMode === 'count' ? 'count' : 'totalValue'}
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    innerRadius={55}
                    paddingAngle={3}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.category} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend & Summary List */}
            <div className="md:col-span-5 space-y-2 max-h-[360px] overflow-y-auto pr-1">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                จำแนกสัดส่วน {metricMode === 'count' ? 'จำนวนรายการ' : 'มูลค่า (บาท)'}
              </h4>
              {chartData.map((item) => {
                const pct =
                  metricMode === 'count'
                    ? totalAssetsCount > 0
                      ? ((item.count / totalAssetsCount) * 100).toFixed(1)
                      : '0'
                    : totalAssetsValue > 0
                    ? ((item.totalValue / totalAssetsValue) * 100).toFixed(1)
                    : '0';

                return (
                  <div
                    key={item.category}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-semibold text-slate-800 truncate">
                        {item.category}
                      </span>
                    </div>
                    <div className="font-mono text-right shrink-0">
                      <span className="font-bold text-slate-900">
                        {metricMode === 'count'
                          ? `${item.count} รายการ`
                          : `฿${item.totalValue.toLocaleString('th-TH')}`}
                      </span>{' '}
                      <span className="text-[11px] text-slate-500 font-sans">
                        ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Category Badges Grid */}
      <div className="pt-3 border-t border-slate-100">
        <span className="text-[11px] font-bold text-slate-500 block mb-2">
          หมวดหมู่ครุภัณฑ์ในสังกัด อบต.วังซ้าย (11 หมวดหมู่):
        </span>
        <div className="flex flex-wrap gap-1.5">
          {chartData.map((item) => (
            <div
              key={item.category}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-50 border border-slate-200"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-700">{item.category}</span>
              <span className="font-mono font-bold text-slate-900 ml-0.5">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
