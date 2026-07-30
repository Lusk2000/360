import React from 'react';

interface FinancialDisplayProps {
  value: number;
  base?: number;
  mode: 'both' | 'currency' | 'percentage';
  className?: string;
  currencyClassName?: string;
  percentageClassName?: string;
  tooltip?: string;
}

export function FinancialDisplay({
  value,
  base,
  mode,
  className = '',
  currencyClassName = '',
  percentageClassName = 'text-xs ml-2 opacity-70 bg-black/20 px-1.5 py-0.5 rounded',
  tooltip
}: FinancialDisplayProps) {
  const currencyStr = `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  let percentageStr = '';
  let percentageVal = 0;
  
  if (base !== undefined && base !== 0) {
    percentageVal = (value / base) * 100;
    percentageStr = `${percentageVal.toFixed(2)}%`;
  } else if (base !== undefined && base === 0 && value === 0) {
    percentageStr = `0.00%`;
  } else if (base !== undefined && base === 0 && value > 0) {
    percentageStr = `100.00%`;
  }

  const showCurrency = mode === 'both' || mode === 'currency';
  const showPercentage = (mode === 'both' || mode === 'percentage') && base !== undefined;

  return (
    <div className={`inline-flex items-center flex-wrap ${className}`} title={tooltip}>
      {showCurrency && (
        <span className={currencyClassName}>{currencyStr}</span>
      )}
      {showPercentage && percentageStr && (
        <span className={percentageClassName}>
          {mode === 'percentage' ? percentageStr : `(${percentageStr})`}
        </span>
      )}
    </div>
  );
}

export function DisplayModeToggle({ mode, setMode }: { mode: 'both' | 'currency' | 'percentage', setMode: (m: 'both' | 'currency' | 'percentage') => void }) {
  return (
    <div className="flex bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
      <button 
        onClick={() => setMode('currency')}
        className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-colors ${mode === 'currency' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
      >
        R$
      </button>
      <button 
        onClick={() => setMode('percentage')}
        className={`px-3 py-1.5 text-[10px] font-bold uppercase border-l border-r border-slate-800 transition-colors ${mode === 'percentage' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
      >
        %
      </button>
      <button 
        onClick={() => setMode('both')}
        className={`px-3 py-1.5 text-[10px] font-bold uppercase transition-colors ${mode === 'both' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-white'}`}
      >
        Ambos
      </button>
    </div>
  );
}
