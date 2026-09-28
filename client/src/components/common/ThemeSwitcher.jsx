import React from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import useUiStore from '../../store/uiStore';

export const ThemeSwitcher = ({ variant = 'buttons', compact = false }) => {
  const { theme, setTheme } = useUiStore();

  const options = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Laptop },
  ];

  if (compact) {
    // Single toggle button that cycles: dark -> light -> system
    const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
    const CurrentIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Laptop;

    return (
      <button
        type="button"
        onClick={() => setTheme(nextTheme)}
        className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-navy-800 transition-colors cursor-pointer"
        title={`Theme: ${theme.toUpperCase()} (Click to change)`}
        aria-label="Toggle theme"
      >
        <CurrentIcon className="w-4 h-4 text-brand-400" />
      </button>
    );
  }

  return (
    <div className="flex items-center p-1 bg-slate-100 dark:bg-navy-950/80 border border-slate-200 dark:border-navy-700 rounded-xl select-none">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = theme === opt.id;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTheme(opt.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isSelected
                ? 'bg-white dark:bg-navy-800 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title={`Switch to ${opt.label} mode`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ThemeSwitcher;
