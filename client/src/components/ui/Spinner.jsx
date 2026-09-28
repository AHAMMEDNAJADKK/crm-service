import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = ({
  size = 'md',
  color = 'text-brand-600',
  className = '',
  fullPage = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const spinnerContent = (
    <Loader2 className={`animate-spin ${sizeClasses[size] || sizeClasses.md} ${color} ${className}`} />
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/10 backdrop-blur-xs">
        <div className="p-4 bg-white rounded-xl shadow-xl border border-slate-100 flex flex-col items-center">
          {spinnerContent}
          <span className="text-xs text-slate-500 font-medium mt-2">Loading...</span>
        </div>
      </div>
    );
  }

  return spinnerContent;
};

export default Spinner;
