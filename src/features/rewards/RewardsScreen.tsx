import React, { useState } from 'react';
import { GreenCard, ChoiceTabs, SectionTitle } from '../../components/common/CommonWidgets';
import {
  Award,
  ChevronRight,
  ShoppingCart,
  ShoppingBag,
  Footprints,
  Recycle,
  TreePine,
  Clock,
  History,
} from 'lucide-react';
import { INITIAL_LEDGER_ENTRIES } from '../../data/mockData';

interface RewardsScreenProps {
  onNavigate: (page: string) => void;
}

export const RewardsScreen: React.FC<RewardsScreenProps> = ({ onNavigate }) => {
  const [filter, setFilter] = useState(0); // 0: All, 1: Vouchers, 2: Products, 3: Donations
  const [showHistory, setShowHistory] = useState(false);

  const filters = ['All', 'Vouchers', 'Products', 'Donations'];

  const actionCards = [
    {
      title: 'Cart',
      displayName: 'Green Cart & Verified Store',
      desc: 'Buy verified products & projects · instant automated credits',
      icon: <ShoppingCart size={28} className="text-[#008b5b]" />,
      bg: 'bg-[#e4f7eb]',
    },
    {
      title: 'Green Buy',
      displayName: 'Green Buy Alternatives',
      desc: 'Explore lower-carbon product swaps and compare LCA scores',
      icon: <ShoppingBag size={28} className="text-[#008b5b]" />,
      bg: 'bg-[#eef8f3]',
    },
    {
      title: 'Green Move',
      displayName: 'Green Move',
      desc: 'Verify commute substitution · zero emission transport',
      icon: <Footprints size={28} className="text-[#008b5b]" />,
      bg: 'bg-[#eaf2fa]',
    },
    {
      title: 'Recycle Red',
      displayName: 'Recycle Red',
      desc: 'Verify certified electronic waste hand-off',
      icon: <Recycle size={28} className="text-red-500" />,
      bg: 'bg-[#ffefef]',
    },
    {
      title: 'Grow Green',
      displayName: 'Grow Green',
      desc: 'Register planting plot and day-30 check-ins',
      icon: <TreePine size={28} className="text-[#008b5b]" />,
      bg: 'bg-[#eff7e8]',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Wallet Balance Hero Banner */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#68cf9d] to-[#008b5b] text-white shadow-md">
        <span className="text-xs text-white/90 font-medium">Your Balance</span>
        <div className="flex items-center justify-between mt-1">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            1,420 <span className="text-lg font-normal text-white/80">GP</span>
          </div>
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="py-1.5 px-3 bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 backdrop-blur-xs"
          >
            <History size={15} />
            {showHistory ? 'View actions' : 'View History'}
          </button>
        </div>
        <p className="text-xs text-white/85 mt-2">
          100 GP provisional · awaiting verification checkpoints
        </p>
      </div>

      {/* Reward Categories Tabs */}
      <ChoiceTabs
        labels={filters}
        selected={filter}
        onChanged={(v) => {
          setFilter(v);
          setShowHistory(false);
        }}
      />

      {showHistory ? (
        <div className="space-y-3">
          <SectionTitle title="Reward history" />
          {INITIAL_LEDGER_ENTRIES.map((entry) => (
            <GreenCard key={entry.event_id} padding="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#e4f7eb] text-[#008b5b] rounded-xl shrink-0">
                    <Award size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#10243b]">
                      +{entry.points_delta} GP · {entry.entry_type}
                    </h4>
                    <p className="text-xs text-[#53667b]">
                      Event: {entry.event_id}
                    </p>
                    <p className="text-[11px] text-[#899ba8]">
                      Policy: {entry.policy_version} · {new Date(entry.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                    entry.entry_type === 'VESTED'
                      ? 'bg-[#e4f7eb] text-[#008b5b]'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {entry.entry_type}
                </span>
              </div>
            </GreenCard>
          ))}
        </div>
      ) : filter !== 0 ? (
        <GreenCard padding="p-6">
          <div className="text-center space-y-2">
            <Clock size={36} className="mx-auto text-[#008b5b]/70" />
            <h4 className="text-base font-bold text-[#10243b]">
              {filters[filter]} Catalog Coming Soon
            </h4>
            <p className="text-xs sm:text-sm text-[#53667b] max-w-sm mx-auto">
              Partner redemption options are being configured. Your verified balance of 1,420 GP remains safe in your wallet.
            </p>
          </div>
        </GreenCard>
      ) : (
        <div className="space-y-3">
          <SectionTitle title="Earn Green Points" />
          {actionCards.map((action) => (
            <GreenCard
              key={action.title}
              bgColor={action.bg}
              padding="p-4"
              onClick={() => onNavigate(action.title)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="p-2 bg-white rounded-xl shadow-2xs shrink-0">
                    {action.icon}
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-[#10243b]">
                      {action.displayName || action.title}
                    </h4>
                    <p className="text-xs text-[#53667b]">{action.desc}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-[#008b5b] shrink-0" />
              </div>
            </GreenCard>
          ))}
        </div>
      )}

      <p className="text-[11px] text-[#53667b] leading-tight pt-2">
        Green Points are distinct from estimated CO2e and are not tradable carbon credits.
      </p>
    </div>
  );
};
