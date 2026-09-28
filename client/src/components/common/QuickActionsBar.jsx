import React from 'react';
import { Plus, IndianRupee, TrendingDown, Clock, AlertCircle } from 'lucide-react';

export const QuickActionsBar = ({
  onAddVehicle,
  onAddPayment,
  onAddExpense,
  onViewTodaysServices,
  onViewOutstanding
}) => {
  const actions = [
    { label: '+ Add Vehicle', icon: Plus, onClick: onAddVehicle, primary: true },
    { label: '+ Add Payment', icon: IndianRupee, onClick: onAddPayment },
    { label: '+ Add Expense', icon: TrendingDown, onClick: onAddExpense },
    { label: "Today's Services", icon: Clock, onClick: onViewTodaysServices },
    { label: 'Outstanding Payments', icon: AlertCircle, onClick: onViewOutstanding }
  ];

  return (
    <div className="w-full overflow-x-auto pb-1.5 -mx-1 px-1 flex items-center gap-2 select-none no-scrollbar">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.label}
            type="button"
            onClick={act.onClick}
            className={`whitespace-nowrap inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all active:scale-95 cursor-pointer shrink-0 ${
              act.primary
                ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/25 shadow-md ring-2 ring-brand-500/30'
                : 'bg-white dark:bg-navy-800 hover:bg-slate-50 dark:hover:bg-navy-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-navy-700'
            }`}
          >
            <Icon className={`w-4 h-4 ${act.primary ? 'text-white' : 'text-slate-400'}`} />
            <span>{act.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default QuickActionsBar;
