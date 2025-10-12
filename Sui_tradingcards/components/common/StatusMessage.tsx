import React from 'react';

interface StatusMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

export function StatusMessage({ type, message, onClose }: StatusMessageProps) {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-400/50 text-green-200';
      case 'error':
        return 'bg-red-500/20 border-red-400/50 text-red-200';
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-400/50 text-yellow-200';
      case 'info':
        return 'bg-blue-500/20 border-blue-400/50 text-blue-200';
      default:
        return 'bg-white/10 border-white/20 text-gray-200';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStyles()}`}>
      <div className="flex items-center justify-between">
        <p className="font-medium">
          {getIcon()} {message}
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-gray-300 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-12 w-12';
      default:
        return 'h-6 w-6';
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className={`animate-spin rounded-full border-b-2 border-purple-400 ${getSizeClass()}`}></div>
      {text && <p className="ml-2 text-gray-200">{text}</p>}
    </div>
  );
}
