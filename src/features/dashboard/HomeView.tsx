import React, { useState } from 'react';
import { GreenCard, ChoiceTabs, MetricRow, SectionTitle } from '../../components/common/CommonWidgets';
import {
  Footprints,
  ShoppingBag,
  ShoppingCart,
  Zap,
  Cloud,
  Award,
  Bot,
  QrCode,
  TreePine,
  Recycle,
  Leaf,
  ArrowRight,
  MapPin,
  Mail,
  Phone,
  Globe,
  Eye,
  EyeOff,
} from 'lucide-react';
import { INITIAL_METRICS } from '../../data/mockData';
import { CurrencyCode, CURRENCY_SYMBOLS } from '../../utils/currency';

interface HomeViewProps {
  onNavigate: (destination: string) => void;
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, currency, onCurrencyChange }) => {
  const [periodIndex, setPeriodIndex] = useState(0);
  const periodKeys: ('today' | 'week' | 'month')[] = ['today', 'week', 'month'];
  const currentKey = periodKeys[periodIndex];
  const metrics = INITIAL_METRICS[currentKey];

  // User Contact & Privacy state
  const [locationStr, setLocationStr] = useState('New Delhi / Bangalore, India');
  const [emailStr] = useState('sreepathink@carbonlens.dev');
  const [phoneStr] = useState('+91 98765 43210');
  const [isEmailPublic, setIsEmailPublic] = useState(true);
  const [isPhonePublic, setIsPhonePublic] = useState(false);

  return (
    <div className="space-y-4">
      {/* User Info & Privacy / Currency Bar */}
      <div className="bg-white rounded-3xl border border-[#e8efed] p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e8efed]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#10243b]">
            <MapPin size={15} className="text-[#008b5b]" />
            <span>{locationStr}</span>
          </div>

          {/* Currency Selector */}
          <div className="flex items-center gap-1.5">
            <Globe size={14} className="text-[#008b5b]" />
            <span className="text-xs text-[#53667b] font-medium">Currency:</span>
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
              className="py-1 px-2.5 rounded-xl text-xs font-bold bg-[#f8fbfa] border border-[#e8efed] text-[#10243b] focus:outline-hidden focus:border-[#008b5b]"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
            </select>
          </div>
        </div>

        {/* Contact Info with Public / Private toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Email */}
          <div className="p-2.5 bg-[#f8fbfa] rounded-2xl border border-[#e8efed] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Mail size={15} className="text-[#008b5b] shrink-0" />
              <span className="font-medium text-[#10243b] truncate">
                {isEmailPublic ? emailStr : '••••••••@carbonlens.dev'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsEmailPublic(!isEmailPublic)}
              className="p-1.5 text-[#53667b] hover:text-[#008b5b] rounded-lg hover:bg-gray-100 transition cursor-pointer flex items-center gap-1 text-[10px] font-bold shrink-0"
              title="Toggle Public / Private"
            >
              {isEmailPublic ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>{isEmailPublic ? 'Public' : 'Private'}</span>
            </button>
          </div>

          {/* Mobile Phone */}
          <div className="p-2.5 bg-[#f8fbfa] rounded-2xl border border-[#e8efed] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Phone size={15} className="text-[#008b5b] shrink-0" />
              <span className="font-medium text-[#10243b] truncate">
                {isPhonePublic ? phoneStr : '+91 ••••• •••••'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsPhonePublic(!isPhonePublic)}
              className="p-1.5 text-[#53667b] hover:text-[#008b5b] rounded-lg hover:bg-gray-100 transition cursor-pointer flex items-center gap-1 text-[10px] font-bold shrink-0"
              title="Toggle Public / Private"
            >
              {isPhonePublic ? <Eye size={13} /> : <EyeOff size={13} />}
              <span>{isPhonePublic ? 'Public' : 'Private'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Green Score Card */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#00a66b] to-[#007749] text-white shadow-md">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white flex items-center justify-center shrink-0 shadow-xs">
            <Leaf className="text-[#008b5b] w-8 h-8 sm:w-9 sm:h-9" />
          </div>
          <div className="flex-1">
            <span className="text-xs sm:text-sm text-white/90 font-medium">Your Green Score</span>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5">
              {metrics.green_score} <span className="text-sm sm:text-base font-normal text-white/80">/ 100</span>
            </div>
            <div className="w-full bg-white/20 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-[#a9efc3] h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.green_score}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Period Selection */}
      <ChoiceTabs
        labels={['Today', 'Week', 'Month']}
        selected={periodIndex}
        onChanged={setPeriodIndex}
      />

      {/* Metrics Card */}
      <GreenCard>
        <div className="divide-y divide-[#e8efed]">
          <MetricRow
            icon={<Footprints size={19} />}
            label="Walking"
            value={`${metrics.walking_km} km`}
          />
          <MetricRow
            icon={<ShoppingBag size={19} />}
            label="Greener purchases"
            value={`${metrics.greener_purchases}`}
          />
          <MetricRow
            icon={<Cloud size={19} />}
            label="Estimated CO2e avoided"
            value={`${metrics.avoided_kg_co2e} kg`}
          />
          <MetricRow
            icon={<Award size={19} />}
            label="Green Points"
            value={`${metrics.points_earned} GP`}
            highlight
          />
        </div>
      </GreenCard>

      {/* Balance Card */}
      <GreenCard bgColor="bg-[#e4f7eb]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-[#006b48] font-semibold uppercase tracking-wider">
              Current Balance
            </span>
            <div className="text-2xl font-black text-[#10243b]">
              {metrics.wallet.available_points} GP
            </div>
            <span className="text-xs text-[#53667b]">
              +{metrics.wallet.provisional_points} GP provisional
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('Rewards')}
            className="py-2 px-3.5 bg-white text-[#008b5b] hover:bg-[#d5f0e0] font-bold text-xs sm:text-sm rounded-xl transition border border-[#a9efc3] shadow-2xs cursor-pointer"
          >
            View Rewards
          </button>
        </div>
      </GreenCard>

      {/* AI Insight Card */}
      <GreenCard bgColor="bg-[#f0efff]">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-white rounded-2xl text-[#7772d5] shadow-2xs shrink-0">
            <Bot size={26} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-[#10243b]">AI Insight</h4>
            <p className="text-xs sm:text-sm text-[#404c5e] mt-1 leading-relaxed">
              {metrics.insight}
            </p>
            <button
              type="button"
              onClick={() => onNavigate('Green Buy')}
              className="mt-2 text-xs font-bold text-[#6863cf] hover:text-[#524cb8] flex items-center gap-1 group cursor-pointer"
            >
              Explore alternatives <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </GreenCard>

      {/* Verified Marketplace Banner */}
      <div
        onClick={() => onNavigate('Cart')}
        className="rounded-2xl p-4 bg-gradient-to-r from-[#e4f7eb] to-[#d6f2e2] border border-[#a9efc3] cursor-pointer hover:shadow-xs transition flex items-center justify-between gap-3 shadow-2xs"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-[#008b5b] text-white rounded-xl shadow-xs shrink-0">
            <ShoppingCart size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs sm:text-sm font-bold text-[#10243b]">
                Green Cart & Verified Projects
              </h4>
              <span className="text-[9px] font-extrabold text-[#008b5b] bg-white px-1.5 py-0.2 rounded-full border border-[#a9efc3]">
                ⚡ Auto Credits
              </span>
            </div>
            <p className="text-[11px] text-[#53667b] truncate mt-0.5">
              Buy verified sustainable products & certified planting projects
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1 text-[#008b5b] font-bold text-xs">
          <span>Shop →</span>
        </div>
      </div>

      {/* Quick Actions */}
      <SectionTitle title="Quick actions" />
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        <button
          type="button"
          onClick={() => onNavigate('Cart')}
          className="p-3.5 sm:p-4 bg-white border border-[#008b5b]/40 hover:border-[#008b5b] hover:bg-[#e4f7eb]/40 rounded-2xl font-bold text-xs sm:text-sm text-[#10243b] flex items-center gap-2.5 transition shadow-2xs cursor-pointer"
        >
          <ShoppingCart size={20} className="text-[#008b5b]" />
          <span>Green Cart</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('Scan')}
          className="p-3.5 sm:p-4 bg-white border border-[#e8efed] hover:border-[#008b5b]/50 hover:bg-[#f6faf8] rounded-2xl font-bold text-xs sm:text-sm text-[#10243b] flex items-center gap-2.5 transition shadow-2xs cursor-pointer"
        >
          <QrCode size={20} className="text-[#008b5b]" />
          Scan
        </button>

        <button
          type="button"
          onClick={() => onNavigate('Green Move')}
          className="p-3.5 sm:p-4 bg-white border border-[#e8efed] hover:border-[#008b5b]/50 hover:bg-[#f6faf8] rounded-2xl font-bold text-xs sm:text-sm text-[#10243b] flex items-center gap-2.5 transition shadow-2xs cursor-pointer"
        >
          <Footprints size={20} className="text-[#008b5b]" />
          Green Move
        </button>

        <button
          type="button"
          onClick={() => onNavigate('Grow Green')}
          className="p-3.5 sm:p-4 bg-white border border-[#e8efed] hover:border-[#008b5b]/50 hover:bg-[#f6faf8] rounded-2xl font-bold text-xs sm:text-sm text-[#10243b] flex items-center gap-2.5 transition shadow-2xs cursor-pointer"
        >
          <TreePine size={20} className="text-[#008b5b]" />
          Grow Green
        </button>
      </div>
    </div>
  );
};
