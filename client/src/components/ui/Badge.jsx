import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral',
  className = ''
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide capitalize';

  const variants = {
    // Basic types
    neutral: 'bg-slate-100 text-slate-700',
    info: 'bg-blue-50 text-blue-700 border border-blue-100',
    success: 'bg-green-50 text-green-700 border border-green-100',
    warning: 'bg-amber-50 text-amber-700 border border-amber-100',
    danger: 'bg-red-50 text-red-700 border border-red-100',
    
    // Status mappings
    received: 'bg-blue-50 text-blue-700 border border-blue-100',
    diagnosing: 'bg-purple-50 text-purple-700 border border-purple-100',
    'in-progress': 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    'awaiting-parts': 'bg-amber-50 text-amber-700 border border-amber-100',
    ready: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    complete: 'bg-green-50 text-green-700 border border-green-100',
    completed: 'bg-green-50 text-green-700 border border-green-100',
    cancelled: 'bg-red-50 text-red-700 border border-red-100',
    pending: 'bg-amber-50 text-amber-700 border border-amber-100',
    confirmed: 'bg-blue-50 text-blue-700 border border-blue-100',
    
    // Invoices / Payments
    paid: 'bg-green-50 text-green-700 border border-green-100',
    partial: 'bg-orange-50 text-orange-700 border border-orange-100',
    unpaid: 'bg-red-50 text-red-700 border border-red-100'
  };

  const styleClass = variants[variant] || variants.neutral;

  return (
    <span className={`${baseStyles} ${styleClass} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
