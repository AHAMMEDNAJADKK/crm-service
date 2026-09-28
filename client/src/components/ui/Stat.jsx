import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const Stat = ({
  title,
  value,
  icon: Icon,
  iconBgColor = 'bg-brand-50 text-brand-600',
  trend = null, // e.g. { amount: 12, type: 'up' | 'down' }
  description = '',
  shouldAnimate = true
}) => {
  const [displayValue, setDisplayValue] = useState(shouldAnimate ? 0 : value);

  // Perform CountUp on Mount if numeric
  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayValue(value);
      return;
    }

    // Extract numerical part from value (handles string prefix/postfix like 'Rs. 25000' or '25')
    const numericStr = String(value).replace(/[^0-9.-]/g, '');
    const numValue = parseFloat(numericStr);
    
    if (isNaN(numValue) || numValue <= 0) {
      setDisplayValue(value);
      return;
    }

    let start = 0;
    const duration = 1000; // 1s
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = numValue / steps;
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= numValue) {
        clearInterval(timer);
        setDisplayValue(value);
      } else {
        // Format based on whether input is original currency
        const hasRupee = String(value).includes('₹') || String(value).includes('Rs.');
        if (hasRupee) {
          setDisplayValue(`₹${Math.floor(start).toLocaleString('en-IN')}`);
        } else {
          setDisplayValue(Math.floor(start).toLocaleString());
        }
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, shouldAnimate]);

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
      <div className="flex-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <h3 className="text-2xl font-bold text-slate-800 mt-1">{displayValue}</h3>
        
        {(trend || description) && (
          <div className="flex items-center mt-2.5">
            {trend && (
              <span className={`inline-flex items-center text-xs font-semibold mr-1.5 ${
                trend.type === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.type === 'up' ? (
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                )}
                {trend.amount}%
              </span>
            )}
            {description && <span className="text-xs text-slate-400">{description}</span>}
          </div>
        )}
      </div>

      {Icon && (
        <div className={`p-3.5 rounded-xl ${iconBgColor} shrink-0 ml-4`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
};

export default Stat;
