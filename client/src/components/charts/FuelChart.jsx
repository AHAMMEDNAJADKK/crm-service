import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import formatCurrency from '../../utils/formatCurrency';

export const FuelChart = ({ data = [], height = 250 }) => {
  const chartData = data.map((item) => ({
    name: new Date(item.date).toLocaleDateString(),
    cost: item.totalCost || 0,
    liters: item.liters || 0
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg border border-slate-800 text-xs">
          <p className="font-semibold">{payload[0].payload.name}</p>
          <p className="text-amber-400 mt-0.5">Total Cost: {formatCurrency(payload[0].value)}</p>
          <p className="text-cyan-400">Volume: {payload[0].payload.liters} Liters</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      {chartData.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
          No fuel log records
        </div>
      ) : (
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `₹${val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="cost"
              stroke="#f59e0b"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorFuel)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default FuelChart;
