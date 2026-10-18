import React, { useState } from 'react';
import { GreenCard, ChoiceTabs, SectionTitle, MessageBox } from '../../components/common/CommonWidgets';
import {
  Newspaper,
  Flame,
  Globe,
  Building2,
  TreePine,
  ShieldAlert,
  Sparkles,
  ExternalLink,
  Clock,
  ArrowRight,
  Bookmark,
  CheckCircle2,
} from 'lucide-react';

interface NewsItem {
  id: string;
  category: 'newsletter' | 'project' | 'disaster';
  title: string;
  source: string;
  date: string;
  summary: string;
  content: string;
  badgeColor: string;
  icon: any;
  impactMetric: string;
}

export const EarthPulseScreen: React.FC = () => {
  const [tab, setTab] = useState(0); // 0: Newsletters & Bulletins, 1: Government & Org Projects, 2: Disaster & Wildfire Alerts
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const feedItems: NewsItem[] = [
    {
      id: 'news-1',
      category: 'newsletter',
      title: 'Global Climate Intelligence Weekly Dispatch: Q4 Circular Economy Policy & Plastic Treaty Updates',
      source: 'UN Environment Programme (UNEP) & CarbonLens Editorial',
      date: 'October 18, 2026',
      summary: 'Comprehensive analysis of international packaging regulations, single-use plastic import bans, and corporate ESG compliance standards taking effect this quarter.',
      content: 'The intergovernmental negotiating committee has finalized landmark guidelines for mandatory recycled content in consumer goods packaging. Governments across 45 nations are rolling out extended producer responsibility (EPR) frameworks. Major retailers are accelerating their transition from virgin petroleum-based polymers to certified circular materials like stainless steel, borosilicate glass, and organic bamboo.',
      badgeColor: 'bg-[#e4f7eb] text-[#006b48] border-[#a9efc3]',
      icon: Newspaper,
      impactMetric: '45 Nations Enforcing EPR',
    },
    {
      id: 'news-2',
      category: 'newsletter',
      title: 'Monthly Blue Carbon & Ocean Ecosystem Conservation Digest',
      source: 'Global Marine Foundation',
      date: 'October 15, 2026',
      summary: 'New satellite telemetry reveals a 14% increase in restored coastal mangrove health and seagrass sequestration capacity across tropical estuaries.',
      content: 'Coastal mangrove restoration projects funded by verified carbon credits and green marketplace purchases have successfully sequestered over 1.2 million tons of CO2 this year alone. Local fisherfolk and indigenous stewards report returning marine biodiversity, including endangered green sea turtles and juvenile reef fish.',
      badgeColor: 'bg-[#e4f7eb] text-[#006b48] border-[#a9efc3]',
      icon: Newspaper,
      impactMetric: '1.2M Tons CO2 Sequestered',
    },
    {
      id: 'news-3',
      category: 'project',
      title: 'Municipal "Sponge City" Urban Canopy & Rainwater Harvesting Initiative',
      source: 'European Union Urban Resilience Directorate & City Councils',
      date: 'October 17, 2026',
      summary: 'Multi-billion dollar municipal infrastructure grant program launched to plant 5 million native shade trees and convert impervious asphalt parking to permeable bio-swales.',
      content: 'To combat urban heat islands and flash flooding, municipal governments are partnering with ecological engineering firms to deploy native canopy trees and modular permeable pavements. The initiative aims to lower urban core temperatures by 2.4°C while recharging deep municipal aquifers naturally.',
      badgeColor: 'bg-[#e4f7eb] text-[#006b48] border-[#a9efc3]',
      icon: Building2,
      impactMetric: '5 Million Trees Planted',
    },
    {
      id: 'news-4',
      category: 'project',
      title: 'Global Solar Megagrid & Community Clean Biomass Transition',
      source: 'International Renewable Energy Agency (IRENA)',
      date: 'October 14, 2026',
      summary: 'Government-backed micro-solar and clean biomass cookstove initiatives displace kerosene lamps across rural communities, eliminating indoor air pollution.',
      content: 'A coalition of renewable energy developers and government agencies has successfully deployed over 250,000 decentralized solar-storage microgrids and smokeless clean biomass cookstoves. This transition eliminates toxic black carbon emissions and saves households over 40% on monthly energy expenditure.',
      badgeColor: 'bg-[#e4f7eb] text-[#006b48] border-[#a9efc3]',
      icon: Building2,
      impactMetric: '250k Households Powered',
    },
    {
      id: 'news-5',
      category: 'disaster',
      title: 'Amazon Basin Real-Time Satellite Wildfire & Deforestation Early Warning Alert',
      source: 'INPE Satellite Monitoring & Global Forest Watch',
      date: 'October 18, 2026',
      summary: 'High-resolution infrared satellite tracking detects early dry-season fire anomalies in the southern Amazon transition zone; rapid response teams deployed.',
      content: 'Advanced orbital thermal sensors have flagged 14 high-risk ignition hotspots across pasture-forest boundaries. Automated alert feeds have mobilized indigenous firefighting brigades and aerial water-bombers within 45 minutes of detection, preventing major canopy loss.',
      badgeColor: 'bg-red-50 text-red-700 border-red-200',
      icon: Flame,
      impactMetric: '45-Min Rapid Response',
    },
    {
      id: 'news-6',
      category: 'disaster',
      title: 'Alpine Glacial Retreat & Water Security Monitoring Bulletin',
      source: 'World Glacier Monitoring Service (WGMS)',
      date: 'October 12, 2026',
      summary: 'Unprecedented summer melt rates prompt emergency watershed conservation protocols and artificial snow-storage reservoirs in European and Andean high-altitude basins.',
      content: 'Glaciologists report accelerated ice volume loss across mid-latitude mountain ranges. Regional water authorities are implementing strict agricultural irrigation quotas and investing in subterranean aquifer recharge zones to secure drinking water for downstream agricultural communities through 2030.',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: ShieldAlert,
      impactMetric: 'Watershed Conservation Active',
    },
  ];

  const filteredItems = feedItems.filter((item) => {
    if (tab === 0) return item.category === 'newsletter';
    if (tab === 1) return item.category === 'project';
    if (tab === 2) return item.category === 'disaster';
    return true;
  });

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookmarkedIds.includes(id)) {
      setBookmarkedIds(bookmarkedIds.filter((bId) => bId !== id));
      setToastMsg('Removed from bookmarks');
    } else {
      setBookmarkedIds([...bookmarkedIds, id]);
      setToastMsg('Saved to your climate intelligence bookmarks!');
    }
    setTimeout(() => setToastMsg(null), 2000);
  };

  return (
    <div className="space-y-4">
      {toastMsg && <MessageBox message={toastMsg} />}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#173a30] to-[#081c18] p-5 sm:p-6 rounded-3xl text-white shadow-md relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 opacity-15 pointer-events-none">
          <Globe size={160} />
        </div>
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#a9efc3] text-[#004d33] uppercase tracking-wider">
              Live Earth Intelligence Feed
            </span>
            <span className="text-[11px] text-[#a9efc3] flex items-center gap-1 font-mono">
              <Sparkles size={12} /> Updated Real-Time
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Global Environmental Newsletters, Government Projects & Disaster Alerts
          </h2>
          <p className="text-xs sm:text-sm text-[#a9efc3]/90 max-w-2xl leading-relaxed">
            Curated briefings on international climate policies, organizational green initiatives, municipal sponge cities, and satellite wildfire monitoring.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <ChoiceTabs
        labels={['Environmental Newsletters', 'Green Projects (Gov/Org)', 'Disaster & Wildfire Alerts']}
        selected={tab}
        onChanged={setTab}
      />

      {/* Feed List */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const IconComponent = item.icon;
          const isBookmarked = bookmarkedIds.includes(item.id);

          return (
            <GreenCard
              key={item.id}
              className="hover:shadow-md transition cursor-pointer border-[#e8efed] space-y-3"
              onClick={() => setSelectedNews(item)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-2xl shrink-0 border shadow-2xs ${item.badgeColor}`}>
                    <IconComponent size={20} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${item.badgeColor}`}>
                        {item.category === 'newsletter' && 'Newsletter Bulletin'}
                        {item.category === 'project' && 'Government / Org Project'}
                        {item.category === 'disaster' && 'Climate / Wildfire Alert'}
                      </span>
                      <span className="text-[11px] text-[#899ba8] flex items-center gap-1">
                        <Clock size={11} /> {item.date}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black text-[#10243b] leading-snug hover:text-[#008b5b] transition">
                      {item.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => toggleBookmark(item.id, e)}
                  className={`p-2 rounded-xl transition border ${
                    isBookmarked
                      ? 'bg-[#008b5b] text-white border-[#008b5b]'
                      : 'bg-white text-[#53667b] border-[#e8efed] hover:bg-[#f4f8f6]'
                  }`}
                  title="Bookmark briefing"
                >
                  <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
                </button>
              </div>

              <p className="text-xs sm:text-sm text-[#46594f] leading-relaxed line-clamp-2">
                {item.summary}
              </p>

              <div className="pt-3 border-t border-[#f0f4f2] flex items-center justify-between text-xs">
                <span className="font-semibold text-[#53667b]">
                  Source: <strong className="text-[#10243b]">{item.source}</strong>
                </span>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold px-2.5 py-1 bg-[#e4f7eb] text-[#006b48] rounded-xl border border-[#a9efc3]">
                    {item.impactMetric}
                  </span>
                  <span className="font-bold text-[#008b5b] flex items-center gap-1">
                    Read Full Briefing <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </GreenCard>
          );
        })}
      </div>

      {/* Detailed Reading Modal */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase tracking-wider inline-block mb-2 ${selectedNews.badgeColor}`}>
                  {selectedNews.category.toUpperCase()} · {selectedNews.date}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#10243b] leading-tight">
                  {selectedNews.title}
                </h2>
                <span className="text-xs text-[#53667b] block mt-1">
                  Published by <strong>{selectedNews.source}</strong>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-[#10243b] rounded-full transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-[#f8fbfa] rounded-2xl border border-[#e8efed] space-y-2">
              <span className="text-xs font-bold text-[#006b48] block uppercase tracking-wider">
                Key Impact Metric
              </span>
              <span className="text-lg font-black text-[#10243b]">
                {selectedNews.impactMetric}
              </span>
            </div>

            <div className="space-y-4 text-sm text-[#46594f] leading-relaxed">
              <p className="font-medium text-[#10243b]">{selectedNews.summary}</p>
              <p>{selectedNews.content}</p>
              <p>
                CarbonLens Intelligence compiles real-time telemetry, government climate filings, and institutional research to keep citizens and sustainability leaders fully informed on global ecological milestones and disaster mitigation.
              </p>
            </div>

            <div className="pt-4 border-t border-[#f0f4f2] flex items-center justify-between">
              <button
                type="button"
                onClick={(e) => toggleBookmark(selectedNews.id, e)}
                className={`py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold border transition flex items-center gap-2 ${
                  bookmarkedIds.includes(selectedNews.id)
                    ? 'bg-[#008b5b] text-white border-[#008b5b]'
                    : 'bg-white text-[#10243b] border-[#dce7e2] hover:bg-[#f4f8f6]'
                }`}
              >
                <Bookmark size={16} fill={bookmarkedIds.includes(selectedNews.id) ? 'currentColor' : 'none'} />
                <span>{bookmarkedIds.includes(selectedNews.id) ? 'Bookmarked' : 'Save Briefing'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedNews(null)}
                className="py-2.5 px-6 bg-[#10243b] hover:bg-[#1a385b] text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-xs"
              >
                Close Briefing
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-[11px] text-[#53667b] leading-tight pt-2 text-center">
        Earth Intelligence feed aggregates official UNEP bulletins, IRENA renewable reports, and satellite early-warning climate monitors.
      </p>
    </div>
  );
};
