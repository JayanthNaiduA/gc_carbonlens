import React, { useState } from 'react';
import { GreenCard, ChoiceTabs, MetricRow, SectionTitle } from '../../components/common/CommonWidgets';
import {
  Footprints,
  ShoppingBag,
  ShoppingCart,
  Zap,
  Cloud,
  Award,
  QrCode,
  TreePine,
  Recycle,
  Leaf,
  ArrowRight,
  MapPin,
  Globe,
  Sun,
  Wind,
  CloudRain,
  Navigation,
} from 'lucide-react';
import { INITIAL_METRICS } from '../../data/mockData';
import { CurrencyCode, CURRENCY_SYMBOLS } from '../../utils/currency';
import { useRewards } from '../rewards/RewardsContext';

import { User } from '../../types';

interface HomeViewProps {
  user: User;
  onNavigate: (destination: string) => void;
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ user, onNavigate, currency, onCurrencyChange }) => {
  const { availablePoints, provisionalPoints } = useRewards();
  const [periodIndex, setPeriodIndex] = useState(0);
  const periodKeys: ('today' | 'week' | 'month')[] = ['today', 'week', 'month'];
  const currentKey = periodKeys[periodIndex];
  const metrics = INITIAL_METRICS[currentKey];

  const [locationStr, setLocationStr] = useState('New Delhi, India');
  const [lat, setLat] = useState(28.6139);
  const [lon, setLon] = useState(77.2090);
  const [weather, setWeather] = useState<{
    temp: number;
    condition: string;
    windspeed: number;
    bgImage: string;
  } | null>({
    temp: 28,
    condition: 'Sunny & Pleasant',
    windspeed: 12,
    bgImage: 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&w=1200&q=80',
  });
  const [isDetecting, setIsDetecting] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [inputCity, setInputCity] = useState('');

  React.useEffect(() => {
    fetchWeather(lat, lon);
  }, [lat, lon]);

  const fetchWeather = async (latitude: number, longitude: number) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
      if (!res.ok) throw new Error('Weather fetch failed');
      const data = await res.json();
      const cw = data.current_weather;
      if (cw) {
        const temp = Math.round(cw.temperature);
        const wind = cw.windspeed;
        const code = cw.weathercode;
        
        let condition = 'Sunny';
        let bgImage = 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&w=1200&q=80';

        if (code >= 1 && code <= 3) {
          condition = wind > 25 ? 'Windy & Cloudy' : 'Partly Cloudy';
          bgImage = 'https://images.unsplash.com/photo-1534088568595-a068f410bcda?auto=format&fit=crop&w=1200&q=80';
        } else if (code >= 45 && code <= 48) {
          condition = 'Foggy & Misty';
          bgImage = 'https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?auto=format&fit=crop&w=1200&q=80';
        } else if (code >= 51 && code <= 67) {
          condition = 'Rainy Showers';
          bgImage = 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=1200&q=80';
        } else if (wind > 22) {
          condition = 'Windy Breeze';
          bgImage = 'https://images.unsplash.com/photo-1509803874385-db7c23652552?auto=format&fit=crop&w=1200&q=80';
        }

        setWeather({ temp, condition, windspeed: wind, bgImage });
      }
    } catch (err) {
      console.warn('Weather fetch error:', err);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setLat(latitude);
        setLon(longitude);

        try {
          const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const revData = await revRes.json();
          const city = revData.address?.city || revData.address?.town || revData.address?.state || 'Detected Location';
          const country = revData.address?.country ? `, ${revData.address.country}` : '';
          setLocationStr(`${city}${country}`);
        } catch {
          setLocationStr(`Lat: ${latitude.toFixed(2)}, Lon: ${longitude.toFixed(2)}`);
        }
        setIsDetecting(false);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setIsDetecting(false);
        alert('Could not access your location. Please check browser permissions or search manually.');
      },
      { timeout: 10000 }
    );
  };

  const handleSearchCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCity.trim()) return;
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(inputCity.trim())}&count=1`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        setLat(result.latitude);
        setLon(result.longitude);
        setLocationStr(`${result.name}, ${result.country || ''}`);
        setIsEditingLocation(false);
        setInputCity('');
      } else {
        alert('Location not found. Please try another city.');
      }
    } catch (err) {
      console.error('City search failed:', err);
      alert('Failed to search location.');
    }
  };

  return (
    <div className="space-y-4">
      {/* User Welcome Greeting Banner */}
      <div className="bg-white rounded-3xl border border-[#e8efed] p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#e4f7eb] text-[#008b5b] flex items-center justify-center font-bold text-lg shadow-2xs border border-[#008b5b]/20">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <span className="text-xs text-[#53667b] font-medium">Welcome back,</span>
            <h3 className="text-base sm:text-lg font-black text-[#10243b]">{user.displayName}</h3>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-bold text-[#008b5b] bg-[#e4f7eb] px-3 py-1.5 rounded-xl border border-[#a9efc3]">
            Eco Member 🌱
          </span>
        </div>
      </div>

      {/* User Location & Weather Widget with Background Image */}
      <div className="relative rounded-3xl overflow-hidden shadow-md text-white border border-[#e8efed]">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 filter brightness-90"
          style={{ backgroundImage: `url('${weather?.bgImage || 'https://images.unsplash.com/photo-1622383563227-04401ab4e5ea?auto=format&fit=crop&w=1200&q=80'}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#10243b]/90 via-[#10243b]/75 to-[#008b5b]/80 backdrop-blur-2xs" />

        <div className="relative p-5 sm:p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-2xl backdrop-blur-md border border-white/20">
              <MapPin size={16} className="text-[#a9efc3]" />
              <span>{locationStr}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetecting}
                className="py-1.5 px-3 bg-[#008b5b] hover:bg-[#007749] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Navigation size={13} className={isDetecting ? 'animate-spin' : ''} />
                <span>{isDetecting ? 'Detecting...' : 'Detect GPS'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditingLocation(!isEditingLocation)}
                className="py-1.5 px-3 bg-white/20 hover:bg-white/30 text-white font-bold text-xs rounded-xl backdrop-blur-md transition cursor-pointer"
              >
                {isEditingLocation ? 'Cancel' : 'Change City'}
              </button>
            </div>
          </div>

          {isEditingLocation && (
            <form onSubmit={handleSearchCity} className="flex gap-2 pt-1 animate-fadeIn">
              <input
                type="text"
                value={inputCity}
                onChange={(e) => setInputCity(e.target.value)}
                placeholder="Enter city name (e.g. London, Tokyo, Delhi)..."
                className="flex-1 py-2 px-3 text-xs rounded-xl bg-white/95 text-[#10243b] placeholder-gray-500 font-medium focus:outline-hidden shadow-sm"
              />
              <button
                type="submit"
                className="py-2 px-4 bg-[#008b5b] hover:bg-[#007749] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Search
              </button>
            </form>
          )}

          {weather && (
            <div className="flex items-center justify-between pt-2 border-t border-white/20">
              <div className="flex items-center gap-3">
                <div className="text-3xl font-black tracking-tight">
                  {weather.temp}°C
                </div>
                <div>
                  <div className="text-sm font-bold text-[#a9efc3] flex items-center gap-1.5">
                    {weather.condition.toLowerCase().includes('sun') && <Sun size={15} />}
                    {weather.condition.toLowerCase().includes('cloud') && <Cloud size={15} />}
                    {weather.condition.toLowerCase().includes('wind') && <Wind size={15} />}
                    {weather.condition.toLowerCase().includes('rain') && <CloudRain size={15} />}
                    {!weather.condition.toLowerCase().includes('sun') && !weather.condition.toLowerCase().includes('cloud') && !weather.condition.toLowerCase().includes('wind') && !weather.condition.toLowerCase().includes('rain') && <Sun size={15} />}
                    <span>{weather.condition}</span>
                  </div>
                  <span className="text-[11px] text-white/80">Wind speed: {weather.windspeed} km/h • Air Quality: Good 🍃</span>
                </div>
              </div>

              {/* Currency Selector beside weather */}
              <div className="flex items-center gap-1.5 bg-black/30 p-2 rounded-2xl backdrop-blur-sm border border-white/10">
                <Globe size={14} className="text-[#a9efc3]" />
                <span className="text-xs text-white/90 font-medium hidden sm:inline">Currency:</span>
                <select
                  value={currency}
                  onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
                  className="py-1 px-2 rounded-xl text-xs font-bold bg-white text-[#10243b] focus:outline-hidden"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            </div>
          )}
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
              {availablePoints.toLocaleString()} GP
            </div>
            <span className="text-xs text-[#53667b]">
              +{provisionalPoints} GP provisional
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
