import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  className = '',
  bodyClassName = ''
}) => {
  return (
    <div className={`bg-white dark:bg-navy-800 border border-slate-200/80 dark:border-navy-700 rounded-2xl shadow-xs overflow-hidden flex flex-col transition-colors ${className}`}>
      {/* Card Header */}
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-slate-100 dark:border-navy-700 flex items-center justify-between bg-slate-50/40 dark:bg-navy-850">
          <div>
            {title && <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wide">{title}</h4>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      {/* Card Body */}
      <div className={`p-6 flex-1 text-slate-800 dark:text-slate-200 ${bodyClassName}`}>
        {children}
      </div>

      {/* Card Footer */}
      {footer && (
        <div className="px-6 py-3 bg-slate-50 dark:bg-navy-850 border-t border-slate-100 dark:border-navy-700 text-xs text-slate-500 dark:text-slate-400">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
