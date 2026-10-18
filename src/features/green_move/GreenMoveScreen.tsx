import React, { useState } from 'react';
import {
  Footprints,
  Bike,
  Car,
  MapPin,
  Navigation,
  ShieldCheck,
  Zap,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Filter,
  Activity,
  Maximize2,
  Minimize2,
  Layers,
} from 'lucide-react';
import { GreenCard, ChoiceTabs, SectionTitle } from '../../components/common/CommonWidgets';
import { ConsentPreferences } from '../../types';

interface GreenMoveScreenProps {
  consent: ConsentPreferences;
  isDemo?: boolean;
}

interface MoveActivityRecord {
  id: string;
  date: string;
  type: 'walk' | 'cycle' | 'car';
  title: string;
  distanceKm: number;
  durationMin: number;
  co2SavedKg: number;
  creditsEarned: number;
  status: 'Auto-Awarded by GCP AI' | 'Pending Verification';
}

export const GreenMoveScreen: React.FC<GreenMoveScreenProps> = ({ consent, isDemo = true }) => {
  const [timeFilter, setTimeFilter] = useState<'today' | 'yesterday' | 'week' | 'month'>('today');
  const [activityFilter, setActivityFilter] = useState<'all' | 'walk' | 'cycle' | 'car'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [earnedCreditsTotal, setEarnedCreditsTotal] = useState(380);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');

  const mockActivities: MoveActivityRecord[] = [
    {
      id: 'act-1',
      date: 'Today (8:30 AM)',
      type: 'cycle',
      title: 'Morning Office Commute (Substituted Car)',
      distanceKm: 6.4,
      durationMin: 22,
      co2SavedKg: 1.8,
      creditsEarned: 85,
      status: 'Auto-Awarded by GCP AI',
    },
    {
      id: 'act-2',
      date: 'Today (1:15 PM)',
      type: 'walk',
      title: 'Errand Walk to Sustainable Market',
      distanceKm: 1.8,
      durationMin: 24,
      co2SavedKg: 0.5,
      creditsEarned: 35,
      status: 'Auto-Awarded by GCP AI',
    },
    {
      id: 'act-3',
      date: 'Yesterday (5:45 PM)',
      type: 'car',
      title: 'Emergency Heavy Freight Transport',
      distanceKm: 14.2,
      durationMin: 35,
      co2SavedKg: 0.0,
      creditsEarned: 0,
      status: 'Auto-Awarded by GCP AI',
    },
    {
      id: 'act-4',
      date: '2 Days Ago (9:00 AM)',
      type: 'walk',
      title: 'Subway Station Foot Commute',
      distanceKm: 2.5,
      durationMin: 30,
      co2SavedKg: 0.7,
      creditsEarned: 50,
      status: 'Auto-Awarded by GCP AI',
    },
  ];

  const handleSyncGoogleFit = () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccess(true);
      setEarnedCreditsTotal((prev) => prev + 65);
      setTimeout(() => setSyncSuccess(false), 4000);
    }, 1500);
  };

  const filteredActivities = mockActivities.filter((act) => {
    if (activityFilter !== 'all' && act.type !== activityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Google Fit & GCP AI Integration Hero */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#008b5b] to-[#015e3e] text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-15 pointer-events-none">
          <Footprints size={180} />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-white mb-2 backdrop-blur-xs">
            <ShieldCheck size={14} className="text-[#a9efc3]" />
            Google Fit & GCP AI Automated Verification
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Green Move & Commute AI
          </h2>
          <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-xl leading-relaxed">
            Google Fit automatically synchronizes your walking, cycling, and transport logs. Our <span className="font-bold underline decoration-[#a9efc3]">GCP AI Engine</span> detects when you substitute car commutes with walking or cycling and awards Green Credits instantly!
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-white/20 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse"></span>
              <span className="font-bold text-white">Google Fit Connected (Live Sync)</span>
            </div>

            <button
              type="button"
              onClick={handleSyncGoogleFit}
              disabled={isSyncing}
              className="py-2 px-4 bg-white text-[#008b5b] hover:bg-[#e4f7eb] font-black rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Syncing Google Fit…' : 'Sync & Claim AI Credits'}</span>
            </button>
          </div>
        </div>
      </div>

      {syncSuccess && (
        <div className="p-4 bg-[#e4f7eb] border border-[#008b5b]/30 rounded-2xl flex items-center gap-3 text-xs text-[#006b48] font-bold animate-fade-in shadow-xs">
          <CheckCircle2 size={18} className="text-[#008b5b] shrink-0" />
          <span>Google Fit synced successfully! GCP AI verified office commute substitution and awarded +65 Green Credits to your wallet.</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-[#e8efed] p-3.5 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Time Filters */}
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-[#53667b]" />
            {(['today', 'yesterday', 'week', 'month'] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeFilter(tf)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                  timeFilter === tf
                    ? 'bg-[#008b5b] text-white shadow-2xs'
                    : 'bg-[#f8fbfa] border border-[#e8efed] text-[#53667b] hover:text-[#10243b]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Activity Filters */}
          <div className="flex items-center gap-1.5">
            <Filter size={14} className="text-[#53667b]" />
            {(['all', 'walk', 'cycle', 'car'] as const).map((af) => (
              <button
                key={af}
                type="button"
                onClick={() => setActivityFilter(af)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                  activityFilter === af
                    ? 'bg-[#10243b] text-white shadow-2xs'
                    : 'bg-[#f8fbfa] border border-[#e8efed] text-[#53667b] hover:text-[#10243b]'
                }`}
              >
                {af}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real Google Maps Integration with Color-Coded Route Overlay */}
      <div className={`bg-white rounded-3xl border border-[#e8efed] overflow-hidden shadow-xs transition-all duration-300 ${isMapExpanded ? 'h-[550px]' : 'h-[360px]'}`}>
        <div className="p-4 bg-[#f8fbfa] border-b border-[#e8efed] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#e4f7eb] text-[#008b5b] rounded-xl">
              <Navigation size={18} />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#10243b]">Real Google Maps · AI Route & Emission Overlay</h4>
              <p className="text-[11px] text-[#53667b]">Green Line (Cycle) · Green Dots (Walk) · Red Line (Car)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
              className="px-2.5 py-1 bg-white border border-[#dce7e2] text-xs font-semibold rounded-lg text-[#10243b] hover:bg-gray-50 flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              <Layers size={13} className="text-[#008b5b]" />
              {mapType === 'roadmap' ? 'Satellite' : 'Roadmap'}
            </button>
            <button
              type="button"
              onClick={() => setIsMapExpanded(!isMapExpanded)}
              className="p-2 bg-white border border-[#e8efed] rounded-xl text-[#53667b] hover:text-[#10243b] transition cursor-pointer"
              title={isMapExpanded ? 'Minimize Map' : 'Expand Map'}
            >
              {isMapExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* Map iframe Container with Overlay Graphics */}
        <div className="relative w-full h-[calc(100%-65px)]">
          <iframe
            title="Real Google Maps Integration"
            src={`https://maps.google.com/maps?q=37.7749,-122.4194&z=14&t=${mapType === 'satellite' ? 'k' : 'm'}&output=embed`}
            className="w-full h-full border-0 filter contrast-105"
            loading="lazy"
          ></iframe>

          {/* AI Color-Coded Overlay Graphics Simulation on top of Real Google Maps */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            {/* Red Line for Car Commute */}
            <path
              d="M 60,200 Q 180,60 320,140 T 540,80"
              fill="none"
              stroke="#ef4444"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Green Line for Cycle */}
            <path
              d="M 100,260 Q 260,200 400,240 T 660,160"
              fill="none"
              stroke="#008b5b"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Green Dashed Dots for Walk */}
            <path
              d="M 80,80 Q 200,160 340,200 T 500,240"
              fill="none"
              stroke="#10b981"
              strokeWidth="5"
              strokeDasharray="8,8"
              strokeLinecap="round"
            />
          </svg>

          {/* Map Overlay Legend Badge */}
          <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-2xl border border-[#e8efed] shadow-md flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-emerald-700">
              <span className="w-3 h-1 bg-[#008b5b] rounded-full inline-block"></span>
              Cycle (Green)
            </div>
            <div className="flex items-center gap-1.5 font-bold text-emerald-600">
              <span className="w-3 h-1 border-b-2 border-dotted border-[#10b981] inline-block"></span>
              Walk (Dots)
            </div>
            <div className="flex items-center gap-1.5 font-bold text-red-600">
              <span className="w-3 h-1 bg-red-500 rounded-full inline-block"></span>
              Car (Red)
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline & GCP AI Audit Log */}
      <div className="space-y-3">
        <SectionTitle title="Google Fit & GCP AI Detected Activities" />

        <div className="space-y-2.5">
          {filteredActivities.map((act) => (
            <div
              key={act.id}
              className="bg-white rounded-2xl border border-[#e8efed] p-4 flex items-center justify-between shadow-xs hover:border-[#008b5b]/50 transition"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                    act.type === 'cycle'
                      ? 'bg-emerald-100 text-emerald-800'
                      : act.type === 'walk'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {act.type === 'cycle' ? <Bike size={22} /> : act.type === 'walk' ? <Footprints size={22} /> : <Car size={22} />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        act.type === 'car' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {act.type === 'car' ? 'Fossil Fuel Commute (Red)' : 'Sustainable Active (Green)'}
                    </span>
                    <span className="text-[11px] text-[#53667b]">{act.date}</span>
                  </div>

                  <h4 className="text-sm font-bold text-[#10243b] truncate mt-0.5">
                    {act.title}
                  </h4>

                  <p className="text-xs text-[#53667b] mt-0.5 flex items-center gap-3">
                    <span>📏 {act.distanceKm} km</span>
                    <span>⏱️ {act.durationMin} mins</span>
                    <span>🍃 {act.co2SavedKg} kg CO2e avoided</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                {act.creditsEarned > 0 ? (
                  <span className="text-xs font-black text-[#008b5b] bg-[#e4f7eb] px-3 py-1 rounded-full border border-[#008b5b]/30 flex items-center gap-1 shadow-2xs">
                    <Zap size={13} />
                    +{act.creditsEarned} Credits
                  </span>
                ) : (
                  <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    No credit (Car)
                  </span>
                )}
                <span className="text-[10px] text-[#53667b] block mt-1">{act.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-[#53667b] leading-relaxed pt-1">
        GCP AI automatically checks your office commute baseline. If you drove yesterday and walked or cycled today, credits are deposited instantly with zero manual entry.
      </p>
    </div>
  );
};
