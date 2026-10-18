import React, { useState } from 'react';
import {
  Home,
  QrCode,
  ShoppingBag,
  ShoppingCart,
  Footprints,
  TreePine,
  Recycle,
  Award,
  Bot,
  Globe,
  BarChart3,
  Users,
  Settings as SettingsIcon,
  ChevronLeft,
  User as UserIcon,
  Leaf,
  MoreHorizontal,
  X,
  Zap,
} from 'lucide-react';
import { User, ConsentPreferences } from '../../types';
import { CurrencyCode, useCurrency } from '../../utils/currency';
import { HomeView } from './HomeView';
import { ScanScreen } from '../scan/ScanScreen';
import { RecommendationsScreen } from '../recommendations/RecommendationsScreen';
import { CartScreen } from '../cart/CartScreen';
import { useCart } from '../cart/CartContext';
import { GreenMoveScreen } from '../green_move/GreenMoveScreen';
import { GrowGreenScreen } from '../grow_green/GrowGreenScreen';
import { RecycleRedScreen } from '../recycle_red/RecycleRedScreen';
import { RewardsScreen } from '../rewards/RewardsScreen';
import { AiScreen } from '../ai/AiScreen';
import { EarthPulseScreen } from '../earth_pulse/EarthPulseScreen';
import { ReportsScreen } from '../reports/ReportsScreen';
import { CommunityScreen } from '../community/CommunityScreen';
import { SettingsScreen } from '../settings/SettingsScreen';

interface DashboardLayoutProps {
  user: User;
  consent: ConsentPreferences;
  onUpdateConsent: (consent: ConsentPreferences) => void;
  onSignOut: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  user,
  consent,
  onUpdateConsent,
  onSignOut,
}) => {
  const [selected, setSelected] = useState('Home');
  const [latestScanId, setLatestScanId] = useState<string>('scan-bamboo-toothbrush-8821');
  const [showMoreModal, setShowMoreModal] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const { cartCount } = useCart();

  const destinations = [
    { name: 'Home', icon: <Home size={18} /> },
    { name: 'Scan', icon: <QrCode size={18} /> },
    { name: 'Green Buy', icon: <ShoppingBag size={18} /> },
    { name: 'Cart', icon: <ShoppingCart size={18} />, badge: cartCount },
    { name: 'Green Move', icon: <Footprints size={18} /> },
    { name: 'Grow Green', icon: <TreePine size={18} /> },
    { name: 'Recycle Red', icon: <Recycle size={18} /> },
    { name: 'Rewards', icon: <Award size={18} /> },
    { name: 'CarbonLens AI', icon: <Bot size={18} /> },
    { name: 'Earth Intelligence', icon: <Globe size={18} /> },
    { name: 'Reports', icon: <BarChart3 size={18} /> },
    { name: 'Community', icon: <Users size={18} /> },
    { name: 'Settings', icon: <SettingsIcon size={18} /> },
  ];

  const handleNavigate = (page: string) => {
    setSelected(page);
    setShowMoreModal(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentPage = () => {
    switch (selected) {
      case 'Scan':
        return (
          <ScanScreen
            consent={consent}
            onNavigate={handleNavigate}
            onScanCompleted={(id) => setLatestScanId(id)}
          />
        );
      case 'Green Buy':
        return <RecommendationsScreen onNavigate={handleNavigate} />;
      case 'Cart':
        return <CartScreen user={user} onNavigate={handleNavigate} />;
      case 'Green Move':
        return <GreenMoveScreen consent={consent} isDemo={user.isDemo} />;
      case 'Grow Green':
        return <GrowGreenScreen consent={consent} />;
      case 'Recycle Red':
        return <RecycleRedScreen consent={consent} />;
      case 'Rewards':
        return <RewardsScreen onNavigate={handleNavigate} />;
      case 'CarbonLens AI':
        return (
          <AiScreen
            consent={consent}
            userName={user.displayName.split(' ')[0]}
            initialScanId={latestScanId}
          />
        );
      case 'Earth Intelligence':
        return <EarthPulseScreen />;
      case 'Reports':
        return <ReportsScreen />;
      case 'Community':
        return <CommunityScreen />;
      case 'Settings':
        return (
          <SettingsScreen
            user={user}
            consent={consent}
            onUpdateConsent={onUpdateConsent}
            onSignOut={onSignOut}
          />
        );
      case 'Home':
      default:
        return <HomeView onNavigate={handleNavigate} currency={currency} onCurrencyChange={setCurrency} />;
    }
  };

  // Mobile Bottom bar destinations
  const bottomBarTabs = [
    { name: 'Home', icon: <Home size={20} /> },
    { name: 'Green Move', label: 'Move', icon: <Footprints size={20} /> },
    { name: 'Scan', icon: <QrCode size={20} /> },
    { name: 'Rewards', icon: <Award size={20} /> },
    { name: 'More', icon: <MoreHorizontal size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[#f8fbfa] text-[#10243b] flex flex-col md:flex-row">
      {/* Desktop Sidebar (visible on md screens >= 900px) */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#e8efed] shrink-0 sticky top-0 h-screen overflow-y-auto p-4">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-3 py-3 mb-4">
          <div className="p-2 bg-[#e4f7eb] text-[#008b5b] rounded-xl shadow-2xs">
            <Leaf size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-[#10243b]">CarbonLens</h1>
            <span className="text-[11px] text-[#008b5b] font-bold block -mt-0.5">Verified Eco Actions</span>
          </div>
        </div>

        {/* Navigation destinations */}
        <nav className="space-y-1 flex-1">
          {destinations.map((dest) => {
            const isActive = selected === dest.name;
            return (
              <button
                key={dest.name}
                type="button"
                onClick={() => handleNavigate(dest.name)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition text-left ${
                  isActive
                    ? 'bg-[#e4f7eb] text-[#008b5b] shadow-2xs font-bold'
                    : 'text-[#53667b] hover:bg-[#f4f8f6] hover:text-[#10243b]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={isActive ? 'text-[#008b5b]' : 'text-[#899ba8]'}>
                    {dest.icon}
                  </span>
                  <span className="truncate">{dest.name}</span>
                </div>
                {dest.name === 'Cart' && cartCount > 0 && (
                  <span className="bg-[#008b5b] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full shrink-0 shadow-2xs">
                    {cartCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Mini Card in Sidebar Footer */}
        <div className="pt-3 border-t border-[#e8efed] mt-2">
          <div
            onClick={() => handleNavigate('Settings')}
            className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[#f4f8f6] cursor-pointer transition"
          >
            <div className="w-8 h-8 rounded-full bg-[#e4f7eb] text-[#008b5b] flex items-center justify-center font-bold text-xs">
              <UserIcon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#10243b] truncate">{user.displayName}</p>
              <p className="text-[10px] text-[#53667b]">Settings & Privacy</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Top Header / AppBar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#e8efed] px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selected !== 'Home' && (
              <button
                type="button"
                onClick={() => handleNavigate('Home')}
                className="p-1.5 -ml-1.5 text-[#53667b] hover:text-[#10243b] lg:hidden rounded-lg hover:bg-gray-100"
                aria-label="Back to home"
              >
                <ChevronLeft size={22} />
              </button>
            )}

            {selected === 'Home' ? (
              <div
                onClick={() => handleNavigate('Settings')}
                className="flex items-center gap-3 cursor-pointer group"
                title="View Profile, Badges & Bio"
              >
                <div className="w-10 h-10 rounded-full bg-[#e4f7eb] text-[#008b5b] group-hover:bg-[#008b5b] group-hover:text-white transition flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <UserIcon size={20} />
                </div>
                <div>
                  <span className="text-[11px] text-[#53667b] block font-medium group-hover:text-[#008b5b] transition">Good Morning</span>
                  <h2 className="text-sm sm:text-base font-extrabold text-[#10243b] -mt-0.5 group-hover:text-[#008b5b] transition">
                    Hello, {user.displayName}
                  </h2>
                </div>
              </div>
            ) : (
              <h2 className="text-base sm:text-lg font-bold text-[#10243b]">
                {selected}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleNavigate('Cart')}
              className="relative p-2 text-[#53667b] hover:text-[#008b5b] rounded-xl hover:bg-[#e4f7eb] transition"
              title="Green Cart"
              aria-label="View Green Cart"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute 0 top-0.5 right-0.5 bg-[#008b5b] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleNavigate('Settings')}
              className="p-2 text-[#53667b] hover:text-[#008b5b] rounded-xl hover:bg-[#e4f7eb] transition"
              title="Privacy & Account"
            >
              <SettingsIcon size={20} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-3xl w-full mx-auto">
          {user.isDemo && (
            <div className="text-[11px] text-[#657c6c] font-semibold tracking-wide uppercase mb-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#008b5b] inline-block animate-pulse"></span>
              DEMO · Illustrative data • No real rewards
            </div>
          )}

          {renderCurrentPage()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (hidden on lg >= 900px) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#e8efed] px-2 py-1.5 flex items-center justify-around shadow-lg">
        {bottomBarTabs.map((tab) => {
          const isActive =
            tab.name === 'More'
              ? showMoreModal
              : selected === tab.name;

          return (
            <button
              key={tab.name}
              type="button"
              onClick={() => {
                if (tab.name === 'More') {
                  setShowMoreModal(true);
                } else {
                  handleNavigate(tab.name);
                }
              }}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition ${
                isActive ? 'text-[#008b5b]' : 'text-[#899ba8] hover:text-[#10243b]'
              }`}
            >
              {tab.icon}
              <span className="text-[10px] font-semibold mt-0.5">
                {tab.label || tab.name}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Mobile 'More' Bottom Sheet Modal */}
      {showMoreModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end justify-center lg:hidden">
          <div className="bg-white rounded-t-3xl max-w-md w-full p-5 max-h-[82vh] overflow-y-auto shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#e8efed]">
              <div>
                <h3 className="text-base font-bold text-[#10243b]">More Features</h3>
                <p className="text-[11px] text-[#53667b]">Explore green services, marketplace & verification</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Featured Cart Section in More Features */}
            <div
              onClick={() => handleNavigate('Cart')}
              className="p-3.5 bg-gradient-to-r from-[#e4f7eb] to-[#d7f3e4] border border-[#a9efc3] rounded-2xl cursor-pointer hover:shadow-xs transition flex items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#008b5b] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShoppingCart size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs sm:text-sm font-bold text-[#10243b] truncate">
                      Green Cart & Verified Store
                    </h4>
                    <span className="text-[9px] font-extrabold text-[#008b5b] bg-white px-1.5 py-0.2 rounded-full border border-[#a9efc3] shrink-0">
                      ⚡ Auto Credits
                    </span>
                  </div>
                  <p className="text-[11px] text-[#53667b] truncate mt-0.5">
                    Buy verified products & projects to get credits automatically
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1 text-[#008b5b] font-bold text-xs">
                {cartCount > 0 ? (
                  <span className="bg-[#008b5b] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                    {cartCount} in Cart
                  </span>
                ) : (
                  <span className="bg-white/80 text-[#008b5b] text-[10px] font-bold px-2 py-0.5 rounded-lg border border-[#a9efc3]">
                    Open Cart →
                  </span>
                )}
              </div>
            </div>

            {/* Grid of More Features */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {destinations.slice(2).map((dest) => (
                <button
                  key={dest.name}
                  type="button"
                  onClick={() => handleNavigate(dest.name)}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition ${
                    selected === dest.name
                      ? 'bg-[#e4f7eb] border-[#008b5b]/50 text-[#008b5b] font-bold'
                      : 'bg-[#f8fbfa] border-[#e8efed] text-[#10243b] hover:bg-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[#008b5b] shrink-0">{dest.icon}</span>
                    <span className="text-xs truncate">{dest.name}</span>
                  </div>
                  {dest.name === 'Cart' && cartCount > 0 && (
                    <span className="bg-[#008b5b] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full shrink-0">
                      {cartCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
