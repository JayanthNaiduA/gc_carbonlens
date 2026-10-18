import React from 'react';
import { Leaf } from 'lucide-react';

export const GreenCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  bgColor?: string;
  padding?: string;
  onClick?: () => void;
}> = ({ children, className = '', bgColor = 'bg-white', padding = 'p-4 sm:p-5', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-[#e8efed] shadow-xs ${bgColor} ${padding} transition-all ${
        onClick ? 'cursor-pointer hover:border-[#008b5b]/40 hover:shadow-sm' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const SectionTitle: React.FC<{ title: string; action?: React.ReactNode }> = ({
  title,
  action,
}) => {
  return (
    <div className="flex items-center justify-between my-4">
      <h3 className="text-base sm:text-lg font-bold text-[#10243b]">{title}</h3>
      {action && <div>{action}</div>}
    </div>
  );
};

export const ChoiceTabs: React.FC<{
  labels: string[];
  selected: number;
  onChanged: (index: number) => void;
}> = ({ labels, selected, onChanged }) => {
  return (
    <div className="flex w-full gap-1.5 p-1 bg-[#eef4f5] rounded-xl">
      {labels.map((label, idx) => (
        <button
          key={label}
          type="button"
          onClick={() => onChanged(idx)}
          className={`flex-1 py-2 sm:py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all text-center ${
            selected === idx
              ? 'bg-[#008b5b] text-white shadow-xs'
              : 'text-[#10243b] hover:bg-[#e2ebe9]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export const MetricRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}> = ({ icon, label, value, highlight = false }) => {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#e8efed] last:border-b-0">
      <div className="flex items-center gap-3 text-sm text-[#10243b]">
        <span className="text-[#008b5b] shrink-0">{icon}</span>
        <span>{label}</span>
      </div>
      <div
        className={`text-sm font-bold text-right ${
          highlight ? 'text-[#008b5b]' : 'text-[#10243b]'
        }`}
      >
        {value}
      </div>
    </div>
  );
};

export const MessageBox: React.FC<{
  message: string;
  isError?: boolean;
  className?: string;
}> = ({ message, isError = false, className = '' }) => {
  return (
    <div
      className={`w-full p-3.5 mb-4 rounded-xl text-xs sm:text-sm leading-relaxed border ${
        isError
          ? 'bg-red-50 text-red-800 border-red-200'
          : 'bg-[#e4f7eb] text-[#006b48] border-[#a9efc3]'
      } ${className}`}
    >
      {message}
    </div>
  );
};

export const BrandMark: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={`bg-[#e4f7eb] rounded-2xl sm:rounded-3xl flex items-center justify-center text-[#008b5b] shadow-xs ${
          compact ? 'p-3' : 'p-4 sm:p-5'
        }`}
      >
        <Leaf size={compact ? 28 : 46} className="text-[#008b5b]" />
      </div>
      <h1
        className={`font-extrabold tracking-tight text-[#10243b] mt-3 ${
          compact ? 'text-xl' : 'text-2xl sm:text-3xl'
        }`}
      >
        CarbonLens
      </h1>
      {!compact && (
        <p className="text-xs sm:text-sm text-[#53667b] mt-1.5 max-w-xs">
          See your impact. Choose greener. Earn for change.
        </p>
      )}
    </div>
  );
};
