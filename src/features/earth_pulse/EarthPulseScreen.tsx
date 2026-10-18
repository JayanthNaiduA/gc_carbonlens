import React, { useState } from 'react';
import { GreenCard, ChoiceTabs, SectionTitle } from '../../components/common/CommonWidgets';
import { Landscape } from '../../components/common/Visuals';
import { Newspaper, Lightbulb, MapPin, Sparkles } from 'lucide-react';

export const EarthPulseScreen: React.FC = () => {
  const [tab, setTab] = useState(0); // 0: News, 1: Insights, 2: Local

  return (
    <div className="space-y-4">
      <ChoiceTabs
        labels={['News', 'Insights', 'Local']}
        selected={tab}
        onChanged={setTab}
      />

      {tab === 0 && (
        <div className="space-y-4">
          <Landscape height={170} />

          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#10243b]">
              A greener Earth starts with everyday choices
            </h3>
            <p className="text-xs text-[#53667b] mt-1">
              Illustrated landscape · editorial guidance
            </p>
          </div>

          <SectionTitle title="Reduce repeated packaging" />
          <GreenCard>
            <p className="text-xs sm:text-sm text-[#404c5e] leading-relaxed">
              Choose a reusable bag, use refill options where available and follow local recycling guidance. Transitioning away from single-use plastics prevents microplastic dispersion in oceans and municipal drainage systems.
            </p>
          </GreenCard>

          <SectionTitle title="Micro-mobility benefits" />
          <GreenCard>
            <p className="text-xs sm:text-sm text-[#404c5e] leading-relaxed">
              Replacing short car trips under 3 km with walking or cycling significantly cuts cold-engine fuel spikes and urban tailpipe emissions while supporting cardiovascular health.
            </p>
          </GreenCard>
        </div>
      )}

      {tab === 1 && (
        <div className="space-y-3 pt-2">
          <GreenCard padding="p-5">
            <div className="flex items-start gap-3">
              <Lightbulb size={22} className="text-[#008b5b] shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-[#404c5e] leading-relaxed">
                Your impact insights will use sourced, verified activity. There is no live news or environmental data provider configured in this development environment.
              </p>
            </div>
          </GreenCard>
        </div>
      )}

      {tab === 2 && (
        <div className="space-y-3 pt-2">
          <GreenCard padding="p-5">
            <div className="flex items-start gap-3">
              <MapPin size={22} className="text-[#008b5b] shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-[#404c5e] leading-relaxed">
                Local discovery needs an approved location-aware source. Your location is not collected by this screen.
              </p>
            </div>
          </GreenCard>
        </div>
      )}

      <p className="text-[11px] text-[#53667b] leading-tight pt-2">
        Earth Intelligence is an editorial discovery feature. No fabricated news, arbitrary publication dates or unverified environmental claims are displayed.
      </p>
    </div>
  );
};
