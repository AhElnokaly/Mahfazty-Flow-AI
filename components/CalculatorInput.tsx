import React, { useState, useEffect, useRef } from 'react';
import { Calculator, X, Delete } from 'lucide-react';

interface CalculatorInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const CalculatorInput: React.FC<CalculatorInputProps> = ({ value, onChange, placeholder, disabled, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expression, setExpression] = useState(value);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setExpression(value);
    }
  }, [value, isOpen]);

  const handleCalculate = () => {
    try {
      // Basic safe evaluation of math expression
      // Only allow numbers, dots, and basic operators
      const englishExpression = expression.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
      const sanitized = englishExpression.replace(/[^0-9+\-*/.]/g, '');
      if (!sanitized) return;
      
      // eslint-disable-next-line no-new-func
      const result = new Function(`return ${sanitized}`)();
      
      if (isFinite(result)) {
        const formatted = Number.isInteger(result) ? result.toString() : result.toFixed(2);
        setExpression(formatted);
        onChange(formatted);
      }
    } catch (e) {
      // Invalid expression, do nothing
    }
  };

  const handleKeyPress = (key: string) => {
    if (key === '=') {
      handleCalculate();
      setIsOpen(false);
    } else if (key === 'C') {
      setExpression('');
      onChange('');
    } else if (key === 'DEL') {
      setExpression(prev => prev.slice(0, -1));
    } else {
      setExpression(prev => prev + key);
    }
  };

  const handleDone = () => {
    handleCalculate();
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          inputMode="decimal"
          value={isOpen ? expression : value}
          onChange={(e) => {
            const englishVal = e.target.value.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
            const val = englishVal.replace(/[^0-9+\-*/.]/g, '');
            setExpression(val);
            if (!isOpen) onChange(val);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-transparent placeholder-slate-300 dark:placeholder-slate-700 focus:outline-none pr-12 ${className || 'text-3xl font-black text-slate-900 dark:text-white'}`}
        />
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          className="absolute right-2 p-2 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          <Calculator size={24} />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div ref={modalRef} className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white overflow-x-auto whitespace-nowrap scrollbar-hide">
                {expression || '0'}
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-1 p-2 bg-slate-100 dark:bg-slate-950">
              {['C', 'DEL', '/', '*'].map(btn => (
                <button key={btn} onClick={() => handleKeyPress(btn)} className="p-4 text-lg font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all">
                  {btn === 'DEL' ? <Delete size={20} className="mx-auto" /> : btn === '*' ? '×' : btn === '/' ? '÷' : btn}
                </button>
              ))}
              {['7', '8', '9', '-'].map(btn => (
                <button key={btn} onClick={() => handleKeyPress(btn)} className={`p-4 text-xl font-bold rounded-xl active:scale-95 transition-all ${btn === '-' ? 'bg-white dark:bg-slate-800 text-blue-500' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                  {btn}
                </button>
              ))}
              {['4', '5', '6', '+'].map(btn => (
                <button key={btn} onClick={() => handleKeyPress(btn)} className={`p-4 text-xl font-bold rounded-xl active:scale-95 transition-all ${btn === '+' ? 'bg-white dark:bg-slate-800 text-blue-500' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                  {btn}
                </button>
              ))}
              <div className="col-span-4 grid grid-cols-4 gap-1">
                <div className="col-span-3 grid grid-cols-3 gap-1">
                  {['1', '2', '3', '0', '00', '.'].map(btn => (
                    <button key={btn} onClick={() => handleKeyPress(btn)} className="p-4 text-xl font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all">
                      {btn}
                    </button>
                  ))}
                </div>
                <button onClick={handleDone} className="col-span-1 bg-blue-600 text-white text-2xl font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center">
                  =
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
