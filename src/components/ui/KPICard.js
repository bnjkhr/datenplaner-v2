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

      <div className="flex items-start justify-between pl-3 gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1 truncate">{subtitle}</p>
          )}
          {trend && (
            <div className={`mt-3 text-xs sm:text-sm flex items-center gap-1 ${
              trend.direction === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'
            }`}>
              <span>{trend.direction === 'up' ? '↑' : '↓'}</span>
              <span>{trend.value}%</span>
              <span className="text-gray-400 dark:text-gray-500 ml-1 hidden sm:inline">vs. letzte Woche</span>
            </div>
          )}
        </div>

        {icon && (
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${colors.gradient}
                          flex items-center justify-center text-white text-lg sm:text-xl shadow-lg flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
