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
  Sparkles,
  CheckCircle2,
  Gift,
  ArrowRight,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useRewards } from './RewardsContext';

interface RewardsScreenProps {
  onNavigate: (page: string) => void;
}

interface RedeemableReward {
  id: string;
  category: 'Vouchers' | 'Products' | 'Donations';
  title: string;
  partner: string;
  pointsCost: number;
  description: string;
  badge: string;
  expiry?: string;
}

const REDEEMABLE_REWARDS: RedeemableReward[] = [
  {
    id: 'rew-vouch-5',
    category: 'Vouchers',
    title: '$5 Off Verified Green Store Voucher',
    partner: 'CarbonLens Marketplace',
    pointsCost: 500,
    description: 'Instant discount code valid on any verified plastic-free or circular product in the store.',
    badge: 'Popular Voucher',
    expiry: 'Valid for 90 days',
  },
  {
    id: 'rew-vouch-10',
    category: 'Vouchers',
    title: '$10 Whole Foods & Nature Organic Voucher',
    partner: 'Organic Food Network',
    pointsCost: 950,
    description: 'Digital grocery voucher applicable to organic produce and zero-waste bulk goods.',
    badge: 'High Value',
    expiry: 'Valid for 60 days',
  },
  {
    id: 'rew-vouch-20pct',
    category: 'Vouchers',
    title: '20% Off EcoSmile Oral Care',
    partner: 'EcoSmile Sustainable Lab',
    pointsCost: 350,
    description: 'Save 20% on biodegradable bamboo toothbrushes and refillable plant floss.',
    badge: 'Member Exclusive',
    expiry: 'Valid for 30 days',
  },
  {
    id: 'rew-prod-cutlery',
    category: 'Products',
    title: 'Handcrafted Bamboo Travel Cutlery Set',
    partner: 'EcoNomad Circular',
    pointsCost: 650,
    description: 'Free organic bamboo fork, spoon, knife, and straw set shipped in organic linen pouch.',
    badge: 'Zero Plastic Gift',
  },
  {
    id: 'rew-prod-mesh',
    category: 'Products',
    title: 'Organic Cotton Produce Mesh Bags (3-Pack)',
    partner: 'EcoBazaar Essentials',
    pointsCost: 450,
    description: 'Tare-weight tagged washable mesh bags to end plastic grocery bag usage.',
    badge: 'Eco Bestseller',
  },
  {
    id: 'rew-prod-straws',
    category: 'Products',
    title: 'Stainless Steel Straw Duo + Cleaner Brush',
    partner: 'EcoSip Stainless',
    pointsCost: 300,
    description: 'Food grade 304 curved and straight straw with linen carry pouch.',
    badge: 'Low Points Claim',
  },
  {
    id: 'rew-don-tree',
    category: 'Donations',
    title: 'Sponsor 1 Native Watershed Tree Planting',
    partner: 'Cascadia Bio-Reserve',
    pointsCost: 250,
    description: 'Directly plants 1 geo-tagged native oak sapling with 3-year satellite monitoring.',
    badge: 'Verified Impact',
  },
  {
    id: 'rew-don-ocean',
    category: 'Donations',
    title: 'Remove 1kg Coastal Plastic Waste',
    partner: 'OceanClean Recovery',
    pointsCost: 200,
    description: 'Funds recovery and certified circular recycling of marine plastic waste along shorelines.',
    badge: 'Direct Action',
  },
];

export const RewardsScreen: React.FC<RewardsScreenProps> = ({ onNavigate }) => {
  const [filter, setFilter] = useState(0); // 0: All, 1: Vouchers, 2: Products, 3: Donations
  const [showHistory, setShowHistory] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  const {
    availablePoints,
    provisionalPoints,
    ledgerEntries,
    recentPurchaseReward,
    clearRecentRewardBanner,
    redeemRewardPoints,
  } = useRewards();

  const filters = ['All', 'Vouchers', 'Products', 'Donations'];

  // Filter rewards for catalog tabs
  const currentCategory = filters[filter];
  const catalogItems = REDEEMABLE_REWARDS.filter((item) =>
    filter === 0 ? true : item.category === currentCategory
  );

  // Compute purchase-specific reward stats
  const purchaseEntries = ledgerEntries.filter(
    (e) => e.policy_version?.includes('green-buy') || e.event_id?.startsWith('order-')
  );
  const totalPurchaseRewardsEarned = purchaseEntries.reduce(
    (sum, e) => sum + (e.points_delta > 0 ? e.points_delta : 0),
    0
  );

  const handleRedeem = async (reward: RedeemableReward) => {
    if (availablePoints < reward.pointsCost) {
      alert(`You need ${reward.pointsCost} GP to redeem this reward. Current balance: ${availablePoints} GP.`);
      return;
    }

    const success = await redeemRewardPoints(reward.pointsCost, reward.title);
    if (success) {
      setRedeemSuccess(`Redeemed "${reward.title}" for ${reward.pointsCost} GP! Voucher code sent to your email.`);
      setTimeout(() => setRedeemSuccess(null), 5000);
    }
  };

  const actionCards = [
    {
      title: 'Green Buy',
      displayName: 'Green Buy Marketplace',
      desc: 'Buy verified sustainable products · instant automated green credits',
      icon: <ShoppingBag size={28} className="text-[#008b5b]" />,
      bg: 'bg-[#e4f7eb]',
      badge: 'Earn Instant GP',
    },
    {
      title: 'Cart',
      displayName: 'Green Cart & Checkout',
      desc: 'Complete orders with automated blockchain-style verified credits',
      icon: <ShoppingCart size={28} className="text-[#008b5b]" />,
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
      {/* Recent Green Buy Purchase Notification Banner */}
      {recentPurchaseReward && (
        <div className="bg-[#e4f7eb] border-2 border-[#008b5b] rounded-2xl p-4 shadow-sm flex items-start justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-[#008b5b] text-white rounded-xl shadow-xs shrink-0 mt-0.5">
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase text-[#006b48] bg-white px-2 py-0.5 rounded-full">
                  Recent Purchase Reward Added
                </span>
                <span className="text-[11px] text-[#53667b]">{recentPurchaseReward.date}</span>
              </div>
              <h4 className="text-sm font-black text-[#10243b] mt-0.5">
                +{recentPurchaseReward.points} GP Credited to Your Wallet!
              </h4>
              <p className="text-xs text-[#53667b] mt-0.5">
                Reward for verified eco purchase: <span className="font-bold text-[#10243b]">{recentPurchaseReward.title}</span>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearRecentRewardBanner}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-white transition cursor-pointer"
            title="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Redemption Success Alert */}
      {redeemSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 flex items-center justify-between gap-2 text-xs font-bold text-emerald-900 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{redeemSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setRedeemSuccess(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Wallet Balance Hero Banner */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#68cf9d] to-[#008b5b] text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-15 pointer-events-none">
          <Award size={180} />
        </div>
        <div className="relative z-10">
          <span className="text-xs text-white/90 font-medium">Your Verified Balance</span>
          <div className="flex items-center justify-between mt-1">
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {availablePoints.toLocaleString()} <span className="text-lg font-normal text-white/80">GP</span>
            </div>
            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="py-1.5 px-3 bg-white/20 hover:bg-white/30 text-white font-bold text-xs sm:text-sm rounded-xl transition flex items-center gap-1.5 backdrop-blur-xs cursor-pointer shadow-2xs"
            >
              <History size={15} />
              {showHistory ? 'View Catalog' : 'Reward History'}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-white/90">
            <span>{provisionalPoints} GP provisional · awaiting verification checkpoints</span>
            {totalPurchaseRewardsEarned > 0 && (
              <span className="bg-white/20 px-2 py-0.5 rounded-full font-bold">
                +{totalPurchaseRewardsEarned} GP from Green Buy
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Verified Green Buy Rewards Spotlight Banner */}
      <div className="bg-white rounded-3xl border border-[#e8efed] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-[#e4f7eb] text-[#008b5b] rounded-2xl shrink-0 shadow-2xs">
            <ShoppingBag size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-[#10243b]">Green Buy Rewards</h4>
              <span className="text-[10px] font-black uppercase bg-[#e4f7eb] text-[#008b5b] px-2 py-0.5 rounded-full">
                Verified Eco Purchases
              </span>
            </div>
            <p className="text-xs text-[#53667b] mt-0.5">
              {purchaseEntries.length > 0
                ? `${purchaseEntries.length} verified purchases rewarded · +${totalPurchaseRewardsEarned} GP earned`
                : 'Buy eco-friendly products to earn instant, verified rewards deposited to your wallet.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('Green Buy')}
          className="py-2 px-4 bg-[#008b5b] hover:bg-[#007749] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
        >
          <span>Shop & Earn GP</span>
          <ArrowRight size={14} />
        </button>
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

      {/* Ledger History View */}
      {showHistory ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionTitle title="Reward Ledger History" />
            <span className="text-xs text-[#53667b] font-medium">
              {ledgerEntries.length} total events
            </span>
          </div>

          <div className="space-y-2.5">
            {ledgerEntries.map((entry) => {
              const isPurchase =
                entry.policy_version?.includes('green-buy') ||
                entry.event_id?.startsWith('order-') ||
                entry.event_id?.startsWith('purchase-');
              const isRedemption = entry.points_delta < 0;

              return (
                <GreenCard key={entry.event_id} padding="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          isRedemption
                            ? 'bg-amber-100 text-amber-800'
                            : isPurchase
                            ? 'bg-[#008b5b] text-white shadow-2xs'
                            : 'bg-[#e4f7eb] text-[#008b5b]'
                        }`}
                      >
                        {isRedemption ? (
                          <Gift size={20} />
                        ) : isPurchase ? (
                          <ShoppingBag size={20} />
                        ) : (
                          <Award size={20} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-[#10243b]">
                            {entry.points_delta > 0 ? `+${entry.points_delta}` : entry.points_delta} GP
                          </h4>
                          {isPurchase && (
                            <span className="text-[10px] font-black uppercase bg-[#e4f7eb] text-[#008b5b] px-2 py-0.5 rounded-full">
                              Green Buy Reward
                            </span>
                          )}
                          {isRedemption && (
                            <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                              Redemption
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#53667b] truncate mt-0.5 font-medium">
                          {entry.policy_version}
                        </p>
                        <p className="text-[11px] text-[#899ba8]">
                          Ref: {entry.event_id} · {new Date(entry.created_at).toLocaleDateString()} {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        entry.entry_type === 'VESTED'
                          ? 'bg-[#e4f7eb] text-[#008b5b]'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {entry.entry_type}
                    </span>
                  </div>
                </GreenCard>
              );
            })}
          </div>
        </div>
      ) : filter !== 0 ? (
        /* Redeem Catalog View (Vouchers, Products, Donations) */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionTitle title={`Redeem ${filters[filter]}`} />
            <span className="text-xs text-[#53667b] font-medium">
              Available: {availablePoints.toLocaleString()} GP
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {catalogItems.map((item) => {
              const canAfford = availablePoints >= item.pointsCost;
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-[#e8efed] p-4 flex flex-col justify-between shadow-xs hover:border-[#008b5b]/50 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase bg-[#e4f7eb] text-[#008b5b] px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                      <span className="text-xs font-black text-[#10243b] flex items-center gap-1">
                        <Zap size={13} className="text-[#008b5b]" />
                        {item.pointsCost} GP
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#10243b]">{item.title}</h4>
                    <p className="text-xs text-[#53667b] mt-0.5 font-medium">{item.partner}</p>
                    <p className="text-xs text-[#62778a] mt-2 leading-relaxed">
                      {item.description}
                    </p>
                    {item.expiry && (
                      <p className="text-[10px] text-[#899ba8] mt-2">
                        ⏳ {item.expiry}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#e8efed] flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#53667b]">
                      Cost: <strong className="text-[#10243b]">{item.pointsCost} GP</strong>
                    </span>
                    <button
                      type="button"
                      disabled={!canAfford}
                      onClick={() => handleRedeem(item)}
                      className={`py-1.5 px-3.5 rounded-xl font-bold text-xs transition cursor-pointer shadow-2xs ${
                        canAfford
                          ? 'bg-[#008b5b] hover:bg-[#007749] text-white'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Redeem Now' : 'Need more GP'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* "All" Overview View */
        <div className="space-y-4">
          <SectionTitle title="Ways to Earn Green Points" />
          <div className="space-y-2.5">
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
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-[#10243b]">
                          {action.displayName || action.title}
                        </h4>
                        {action.badge && (
                          <span className="text-[10px] font-black uppercase bg-[#008b5b] text-white px-2 py-0.5 rounded-full">
                            {action.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#53667b]">{action.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-[#008b5b] shrink-0" />
                </div>
              </GreenCard>
            ))}
          </div>

          {/* Quick Redeem Teaser */}
          <div className="bg-gradient-to-r from-[#eef8f3] to-[#e4f7eb] border border-[#a9efc3] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white text-[#008b5b] rounded-xl shadow-2xs shrink-0">
                <Gift size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#10243b]">Ready to redeem your rewards?</h4>
                <p className="text-xs text-[#53667b]">
                  Use your {availablePoints.toLocaleString()} GP for store vouchers, circular products, or tree planting.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFilter(1)}
              className="py-2 px-3.5 bg-white text-[#008b5b] hover:bg-gray-50 border border-[#008b5b]/30 font-bold text-xs rounded-xl transition shadow-2xs cursor-pointer shrink-0"
            >
              Browse Catalog
            </button>
          </div>
        </div>
      )}

      <p className="text-[11px] text-[#53667b] leading-tight pt-2">
        Green Points are earned directly through verified sustainable activities including Green Buy purchases, eco-transit, e-waste recycling, and tree planting.
      </p>
    </div>
  );
};
