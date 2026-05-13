import React from 'react';

const KPICard = ({ title, value, icon, color, change }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
          {change && (
            <p className={`text-xs mt-2 ${change.includes('-') ? 'text-red-500' : 'text-green-500'}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`${color} rounded-full w-12 h-12 flex items-center justify-center text-white text-xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default KPICard;