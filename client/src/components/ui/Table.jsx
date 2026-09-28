import React from 'react';

export const TableContainer = ({ children, className = '' }) => {
  return (
    <div className={`w-full overflow-x-auto border border-slate-200/80 dark:border-navy-700 rounded-2xl bg-white dark:bg-navy-800 shadow-xs transition-colors ${className}`}>
      <table className="w-full text-left border-collapse min-w-[700px]">
        {children}
      </table>
    </div>
  );
};

export const Thead = ({ children, className = '' }) => {
  return <thead className={className}>{children}</thead>;
};

export const Tbody = ({ children, className = '' }) => {
  return <tbody className={`divide-y divide-slate-100 dark:divide-navy-750 ${className}`}>{children}</tbody>;
};

export const Tr = ({ children, className = '', onClick }) => {
  return (
    <tr 
      onClick={onClick}
      className={`hover:bg-slate-50/50 dark:hover:bg-navy-750/50 transition-colors border-b border-slate-100 dark:border-navy-750 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
};

export const Th = ({ children, className = '', isSticky = false }) => {
  return (
    <th 
      className={`px-6 py-3.5 text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/80 dark:bg-navy-850 border-b border-slate-200 dark:border-navy-700 ${
        isSticky ? 'sticky left-0 bg-slate-50/95 dark:bg-navy-850 z-20 shadow-[3px_0_8px_-4px_rgba(0,0,0,0.1)]' : ''
      } ${className}`}
    >
      {children}
    </th>
  );
};

export const Td = ({ children, className = '', isSticky = false }) => {
  return (
    <td 
      className={`px-6 py-4 text-xs text-slate-700 dark:text-slate-200 ${
        isSticky ? 'sticky left-0 bg-white dark:bg-navy-800 z-10 shadow-[3px_0_8px_-4px_rgba(0,0,0,0.1)] border-r border-slate-100/50 dark:border-navy-750' : ''
      } ${className}`}
    >
      {children}
    </td>
  );
};
