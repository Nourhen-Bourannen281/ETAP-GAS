import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

const RevenueChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="orders" name="Commandes" fill="#3B82F6" />
        <Line yAxisId="right" type="monotone" dataKey="revenue" name="CA (TND)" stroke="#10B981" strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default RevenueChart;