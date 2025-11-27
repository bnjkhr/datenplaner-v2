import React from 'react';

const QuickActionCard = ({
  title,
  description,
  icon,
  onClick,
  badge,
  variant = 'default'
}) => {
  const variantClasses = {
    default: 'quick-action-card',
    accent: 'quick-action-card border-accent-200 bg-gradient-to-br from-accent-50 to-purple-accent-50',
  };

  return (
    <div
      className={variantClasses[variant]}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
    >
      <div className="flex items-start gap-4">
        {icon && (
          <div className="quick-action-icon">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
            {badge && (
              <span className="dashboard-badge-pink">{badge}</span>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className="quick-action-arrow text-gray-400 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default QuickActionCard;
