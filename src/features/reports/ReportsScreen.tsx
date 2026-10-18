import React, { useState } from 'react';
import { GreenCard, SectionTitle, MetricRow } from '../../components/common/CommonWidgets';
import {
  Calendar,
  ShoppingBag,
  Car,
  Recycle,
  TreePine,
  BarChart3,
} from 'lucide-react';
import { MONTHLY_REPORT } from '../../data/mockData';

export const ReportsScreen: React.FC = () => {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const weeks = MONTHLY_REPORT.weekly_avoided;
  const maxVal = Math.max(...weeks);

  return (
    <div className="space-y-4">
      {/* Month selector pill */}
      <GreenCard padding="p-3.5">
        <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#10243b]">
          <Calendar size={18} className="text-[#008b5b]" />
          <span>This Month · October 2026</span>
        </div>
      </GreenCard>

      {/* Hero Metric */}
      <div>
        <span className="text-xs text-[#53667b] font-semibold uppercase tracking-wider">
          Estimated CO2e Avoided
        </span>
        <div className="text-3xl sm:text-4xl font-black text-[#10243b] mt-0.5">
          {MONTHLY_REPORT.avoided_kg_co2e} <span className="text-xl font-normal text-[#53667b]">kg</span>
        </div>
      </div>

      {/* Weekly Chart */}
      <GreenCard padding="p-5">
        <h4 className="text-xs font-bold text-[#53667b] uppercase mb-4 tracking-wider">
          Weekly Avoided Emissions (kg CO2e)
        </h4>

        <div className="h-48 flex items-end justify-between gap-3 sm:gap-6 pt-6 pb-2">
          {weeks.map((val, idx) => {
            const heightPercent = (val / maxVal) * 100;
            const isSelected = selectedWeek === idx;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center cursor-pointer group"
                onClick={() => setSelectedWeek(isSelected ? null : idx)}
              >
                <span
                  className={`text-xs font-bold mb-1.5 transition-colors ${
                    isSelected ? 'text-[#008b5b]' : 'text-[#53667b] group-hover:text-[#10243b]'
                  }`}
                >
                  {val}
                </span>

                <div className="w-full max-w-[42px] bg-[#eef4f5] h-32 rounded-lg flex items-end overflow-hidden p-0.5">
                  <div
                    className={`w-full rounded-md transition-all duration-500 bg-gradient-to-t ${
                      isSelected
                        ? 'from-[#007749] to-[#00a66b]'
                        : 'from-[#008b5b] to-[#42c58a] group-hover:opacity-90'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                <span className="text-[11px] font-semibold text-[#53667b] mt-2">
                  Week {idx + 1}
                </span>
              </div>
            );
          })}
        </div>
      </GreenCard>

      {/* Category Breakdown */}
      <SectionTitle title="By Category" />
      <GreenCard>
        <div className="divide-y divide-[#e8efed]">
          {MONTHLY_REPORT.categories.map((cat) => {
            const icon =
              cat.name === 'Transport' ? (
                <Car size={18} />
              ) : cat.name === 'Recycling' ? (
                <Recycle size={18} />
              ) : cat.name === 'Trees' ? (
                <TreePine size={18} />
              ) : (
                <ShoppingBag size={18} />
              );

            return (
              <MetricRow
                key={cat.name}
                icon={icon}
                label={cat.name}
                value={`${cat.value} kg`}
              />
            );
          })}
        </div>
      </GreenCard>

      <p className="text-[11px] text-[#53667b] leading-tight pt-1">
        Carbon estimates, Green Points and sustainability scores remain separate. Illustrative tree/recycling figures are not scientific claims.
      </p>
    </div>
  );
};
