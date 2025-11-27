import React from 'react';

const colorClasses = {
  pink: {
    gradient: 'from-accent-500 to-accent-600',
    bg: 'bg-accent-100',
    text: 'text-accent-700',
  },
  purple: {
    gradient: 'from-purple-accent-500 to-purple-accent-600',
    bg: 'bg-purple-accent-100',
    text: 'text-purple-accent-700',
  },
  blue: {
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
  },
  green: {
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
  },
};

const KPICard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'pink',
  onClick
}) => {
  const colors = colorClasses[color] || colorClasses.pink;

  return (
    <div
      className={`kpi-card ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Accent bar */}
      <div className="kpi-card-accent" />

      <div className="flex items-start justify-between pl-3">
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`mt-3 text-sm flex items-center gap-1 ${
              trend.direction === 'up' ? 'text-emerald-600' : 'text-red-500'
            }`}>
              <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
              <span>{trend.value}%</span>
              <span className="text-gray-400 ml-1">vs. letzte Woche</span>
            </div>
          )}
        </div>

        {icon && (
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.gradient}
                          flex items-center justify-center text-white text-xl shadow-lg`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
