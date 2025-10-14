import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function Button({ 
  children, 
  onClick, 
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = ''
}: ButtonProps) {
  const getVariantStyles = () => {
    // Unified gradient button style for all variants
    const baseStyle = 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 disabled:from-purple-800 disabled:to-blue-800 shadow-lg hover:shadow-xl';
    
    switch (variant) {
      case 'primary':
        return baseStyle;
      case 'secondary':
        return 'bg-white/10 border-2 border-white/30 text-white hover:bg-blue-500/20 hover:border-blue-400/40 disabled:bg-white/5 disabled:border-white/20 shadow-lg hover:shadow-xl';
      case 'danger':
        return 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 disabled:from-red-800 disabled:to-red-900 shadow-lg hover:shadow-xl';
      case 'success':
        return 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 disabled:from-purple-800 disabled:to-blue-800 shadow-lg hover:shadow-xl';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 disabled:from-yellow-700 disabled:to-orange-700 shadow-lg hover:shadow-xl';
      default:
        return baseStyle;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  );
}
