import React from 'react';
import { Plus, Users, Car, CreditCard, TrendingDown, Clock, AlertCircle } from 'lucide-react';

export const QuickActionsBar = ({
  onNewService,
  onNewCustomer,
  onNewVehicle,
  onNewExpense,
  onViewTodaysVehicles,
  onViewOutstanding
}) => {
  const actions = [
    { label: '+ New Service', icon: Plus, onClick: onNewService, primary: true },
    { label: '+ Customer', icon: Users, onClick: onNewCustomer },
    { label: '+ Vehicle', icon: Car, onClick: onNewVehicle },
    { label: '+ Expense', icon: TrendingDown, onClick: onNewExpense },
    { label: "Today's Vehicles", icon: Clock, onClick: onViewTodaysVehicles },
    { label: 'Outstanding', icon: AlertCircle, onClick: onViewOutstanding }
  ];

  return (
    <div className="w-full overflow-x-auto pb-2 -mx-1 px-1 flex items-center gap-2 select-none no-scrollbar">
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <button
            key={act.label}
            type="button"
            onClick={act.onClick}
            className={`whitespace-nowrap inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all active:scale-95 cursor-pointer shrink-0 shadow-2xs ${
              act.primary
                ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20 shadow-md ring-2 ring-brand-500/30'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <Icon className={`w-4 h-4 ${act.primary ? 'text-white' : 'text-slate-500'}`} />
            <span>{act.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default QuickActionsBar;
