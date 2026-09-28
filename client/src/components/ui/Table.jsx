import React from 'react';

export const TableContainer = ({ children, className = '' }) => {
  return (
    <div className={`w-full overflow-x-auto border border-slate-200/60 rounded-xl bg-white shadow-sm ${className}`}>
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
  return <tbody className={className}>{children}</tbody>;
};

export const Tr = ({ children, className = '', onClick }) => {
  return (
    <tr 
      onClick={onClick}
      className={`hover:bg-slate-50/50 transition-colors border-b border-slate-100 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
};

export const Th = ({ children, className = '', isSticky = false }) => {
  return (
    <th 
      className={`px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-100 ${
        isSticky ? 'sticky left-0 bg-slate-50/95 z-20 shadow-[3px_0_8px_-4px_rgba(0,0,0,0.1)]' : ''
      } ${className}`}
    >
      {children}
    </th>
  );
};

export const Td = ({ children, className = '', isSticky = false }) => {
  return (
    <td 
      className={`px-6 py-4 text-sm text-slate-700 ${
        isSticky ? 'sticky left-0 bg-white z-10 shadow-[3px_0_8px_-4px_rgba(0,0,0,0.1)] border-r border-slate-100/50' : ''
      } ${className}`}
    >
      {children}
    </td>
  );
};
