import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function LoadingSpinner({ size = 'md', color = 'purple' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const colorClasses = {
    purple: 'border-purple-500',
    blue: 'border-blue-500'
  };

  return (
    <div className="flex justify-center items-center h-64">
      <div className={`animate-spin rounded-full border-t-2 border-b-2 ${sizeClasses[size]} ${colorClasses[color as keyof typeof colorClasses]}`}></div>
    </div>
  );
} 