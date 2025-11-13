// ModernButton.js - Reusable modern button component
import React from 'react';

const ModernButton = ({ 
  children, 
  variant = 'primary', 
  size = 'medium', 
  onClick, 
  disabled = false,
  className = '',
  loading = false,
  ...props 
}) => {
  const baseClasses = 'font-medium transition-all duration-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'modern-button-primary focus:ring-modern-primary',
    secondary: 'modern-button-secondary focus:ring-modern-primary',
    accent: 'modern-button-accent focus:ring-modern-accent',
    outline: 'border-2 border-modern-primary text-modern-primary hover:bg-modern-primary hover:text-white focus:ring-modern-primary',
    ghost: 'text-modern-primary hover:bg-modern-primary/10 focus:ring-modern-primary',
    danger: 'bg-modern-error text-white hover:bg-modern-error-dark focus:ring-modern-error',
  };
  
  const sizeClasses = {
    small: 'px-3 py-2 text-sm',
    medium: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg',
  };
  
  const stateClasses = disabled 
    ? 'opacity-50 cursor-not-allowed' 
    : 'transform hover:scale-105 hover:shadow-lg';
  
  const loadingClasses = loading 
    ? 'cursor-wait opacity-75' 
    : '';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${stateClasses} ${loadingClasses} ${className}`}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Lädt...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// Convenience components for common button types
export const PrimaryButton = (props) => <ModernButton variant="primary" {...props} />;
export const SecondaryButton = (props) => <ModernButton variant="secondary" {...props} />;
export const AccentButton = (props) => <ModernButton variant="accent" {...props} />;
export const OutlineButton = (props) => <ModernButton variant="outline" {...props} />;
export const GhostButton = (props) => <ModernButton variant="ghost" {...props} />;
export const DangerButton = (props) => <ModernButton variant="danger" {...props} />;

export default ModernButton;