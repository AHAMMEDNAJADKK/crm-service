import React, { useState } from 'react';
import { Languages, Check, Copy } from 'lucide-react';

export const MalayalamInputHelper = ({ onSelectPhrase, targetFieldLabel = 'Field' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const quickPhrases = [
    'നാളെ വീണ്ടും വരണം',
    'ബാക്കി പിന്നീട് തരും',
    'കോഴിക്കോട്',
    'ഫുൾ വാഷിംഗ്',
    'അണ്ടർകോട്ടിംഗ്',
    'ഇന്റീരിയർ ക്ലീനിംഗ്',
    'ഓയിൽ മാറ്റണം',
    'സർവീസ് പൂർത്തിയായി',
    'ഫുൾ പെയ്ഡ്'
  ];

  const handlePick = (phrase, index) => {
    if (onSelectPhrase) {
      onSelectPhrase(phrase);
    }
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  return (
    <div className="mt-1">
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium cursor-pointer"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{isOpen ? 'Hide Malayalam Suggestions' : 'മലയാളം കുറിപ്പുകൾ (Malayalam Helper)'}</span>
        </button>
        <span className="text-[10px] text-slate-400">Mobile Malayalam Keyboard ready</span>
      </div>

      {isOpen && (
        <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-1.5 animate-fadeIn">
          {quickPhrases.map((phrase, idx) => (
            <button
              key={phrase}
              type="button"
              onClick={() => handlePick(phrase, idx)}
              className="px-2.5 py-1 text-xs bg-white hover:bg-brand-50 border border-slate-200 hover:border-brand-300 rounded-md text-slate-700 font-medium transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <span>{phrase}</span>
              {copiedIndex === idx && <Check className="w-3 h-3 text-emerald-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MalayalamInputHelper;
