import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';

export const JobStatsChart = ({ data = [], height = 300 }) => {
  // Color mappings for job statuses
  const statusColors = {
    received: '#3b82f6',
    diagnosing: '#a855f7',
    'in-progress': '#6366f1',
    'awaiting-parts': '#f59e0b',
    ready: '#10b981',
    complete: '#22c55e',
    cancelled: '#ef4444'
  };

  const chartData = data.map((item) => ({
    name: item.status ? item.status.charAt(0).toUpperCase() + item.status.slice(1) : item.name,
    value: item.count || item.value || 0,
    color: statusColors[item.status || item.name.toLowerCase()] || '#64748b'
  })).filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg border border-slate-800 text-xs">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-slate-300 mt-0.5">Jobs count: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      {chartData.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
          No active job records
        </div>
      ) : (
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default JobStatsChart;
