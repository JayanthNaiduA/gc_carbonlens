import React, { useState } from 'react';
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Package,
  X,
  Star,
  Sparkles,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { VERIFIED_MARKET_ITEMS } from '../../data/mockData';
import { GreenMarketItem } from '../../types';
import { useCart } from '../cart/CartContext';
import { useCurrency } from '../../utils/currency';

interface RecommendationsScreenProps {
  onNavigate: (page: string) => void;
}

export const RecommendationsScreen: React.FC<RecommendationsScreenProps> = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [activeModalItem, setActiveModalItem] = useState<GreenMarketItem | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const { addToCart, cartCount } = useCart();
  const { formatPrice } = useCurrency();

  const categories = ['All', 'Personal Care', 'Home', 'Food', 'Projects & Offsets'];

  const filteredItems = VERIFIED_MARKET_ITEMS.filter((item) => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Projects & Offsets') {
      return item.category === 'Projects & Offsets' || item.type === 'project';
    }
    return item.category === selectedCategory;
  }).sort((a, b) => {
    if (sortBy === 'credits-desc') return b.creditsReward - a.creditsReward;
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating-desc') return (b.rating || 4.8) - (a.rating || 4.8);
    if (sortBy === 'co2-desc') return b.co2AvoidedKg - a.co2AvoidedKg;
    return 0; // recommended
  });

  const handleAddToCart = (item: GreenMarketItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    addToCart(item, 1);
    setJustAddedId(item.id);
    setTimeout(() => {
      setJustAddedId(null);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* Amazon / Flipkart Style Top Marketplace Banner */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#008b5b] via-[#016543] to-[#01472f] text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-15 pointer-events-none">
          <ShoppingCart size={180} />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-white mb-2 backdrop-blur-xs">
            <Sparkles size={14} className="text-[#a9efc3]" />
            Amazon & Flipkart Verified Green Store
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Green Buy Marketplace
          </h2>
          <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-xl leading-relaxed">
            Discover 100% biodegradable, verified sustainable products & certified carbon offsets. Earn <span className="font-bold underline decoration-[#a9efc3]">instant Green Credits</span> based on product lifecycle and biodegradable nature.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-white/20 text-xs">
            <button
              type="button"
              onClick={() => onNavigate('Cart')}
              className="py-2 px-4 bg-white text-[#008b5b] hover:bg-[#e4f7eb] font-black rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <ShoppingCart size={16} />
              <span>View Green Cart ({cartCount})</span>
            </button>
            <span className="text-xs text-white/80 font-medium">
              ⚡ Automatic credit deposit upon verified purchase
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Sorting Bar */}
      <div className="bg-white rounded-2xl border border-[#e8efed] p-3.5 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#008b5b] text-white shadow-2xs'
                    : 'bg-[#f8fbfa] border border-[#e8efed] text-[#53667b] hover:text-[#10243b]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown size={14} className="text-[#53667b]" />
            <span className="text-xs text-[#53667b] font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort products by feature"
              className="py-1.5 px-3 rounded-xl text-xs font-bold bg-[#f8fbfa] border border-[#e8efed] text-[#10243b] focus:outline-none focus:border-[#008b5b]"
            >
              <option value="recommended">Featured / Recommended</option>
              <option value="credits-desc">Highest Green Credits</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Customer Rating (★)</option>
              <option value="co2-desc">CO2 Avoided (kg)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Marketplace Product Grid (Amazon / Flipkart Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isJustAdded = justAddedId === item.id;
          return (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-[#e8efed] p-4 flex flex-col justify-between shadow-xs hover:border-[#008b5b]/60 transition relative overflow-hidden group cursor-pointer"
              onClick={() => setActiveModalItem(item)}
            >
              {/* Discount / Deal Tag */}
              {item.discountTag && (
                <div className="absolute top-3 left-3 z-10 bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wide">
                  {item.discountTag}
                </div>
              )}

              <div>
                <div className="flex items-start justify-between gap-2 mb-2 pt-1">
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      item.type === 'project'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item.type === 'project' ? 'Verified Project' : 'Biodegradable Product'}
                  </span>
                  {/* Prominent Green Credits Badge */}
                  <span className="text-[11px] font-black text-[#008b5b] bg-[#e4f7eb] px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#008b5b]/30 shadow-2xs">
                    <Zap size={12} className="text-[#008b5b]" />
                    +{item.creditsReward} Green Credits
                  </span>
                </div>

                {/* Product Image */}
                <div className="flex justify-center my-3 relative">
                  {item.imageUrl ? (
                    <div className="w-full h-44 rounded-2xl overflow-hidden border border-[#e8efed] shadow-2xs bg-gray-50">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-44 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                      Eco Item
                    </div>
                  )}
                </div>

                {/* Amazon / Flipkart Rating & Reviews */}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md text-[11px] font-bold border border-amber-200">
                    <Star size={12} className="fill-amber-400 text-amber-500" />
                    <span>{item.rating || 4.8}</span>
                  </div>
                  <span className="text-[11px] text-[#53667b]">({item.reviewsCount || 1200}+ ratings)</span>
                </div>

                <h4 className="text-sm sm:text-base font-bold text-[#10243b] line-clamp-1 group-hover:text-[#008b5b] transition">
                  {item.name}
                </h4>
                <p className="text-xs text-[#53667b]">
                  {item.brand} · <span className="font-semibold text-[#10243b]">{item.category}</span>
                </p>

                {/* Shipping / Fulfillment info */}
                <p className="text-[11px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                  <Package size={12} />
                  {item.shippingInfo || 'Amazon Choice · FREE Next-Day Delivery'}
                </p>

                {/* CO2 Footprint & Avoided Data */}
                <div className="mt-2 grid grid-cols-2 gap-1.5 bg-[#f8fbfa] p-2 rounded-xl border border-[#e8efed] text-[11px]">
                  <div>
                    <span className="text-[#53667b] block text-[10px]">Footprint</span>
                    <span className="font-bold text-[#10243b]">{item.footprint} kg CO2e</span>
                  </div>
                  <div>
                    <span className="text-[#53667b] block text-[10px]">CO2 Avoided</span>
                    <span className="font-bold text-[#008b5b]">+{item.co2AvoidedKg} kg</span>
                  </div>
                </div>

                <p className="text-xs text-[#62778a] line-clamp-2 mt-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="mt-2.5 text-[10px] text-[#008b5b] font-medium flex items-center gap-1 bg-[#f8fbfa] p-2 rounded-xl border border-[#e8efed]">
                  <ShieldCheck size={13} className="shrink-0 text-[#008b5b]" />
                  <span className="truncate">{item.verificationBadge}</span>
                </div>
              </div>

              {/* Price & Add to Cart Action */}
              <div
                className="mt-4 pt-3 border-t border-[#e8efed] flex items-center justify-between gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <div>
                  <span className="text-[10px] text-[#53667b] block uppercase tracking-wider">Price</span>
                  <span className="text-lg font-black text-[#10243b]">
                    {formatPrice(item.price)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleAddToCart(item, e)}
                  className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                    isJustAdded
                      ? 'bg-[#008b5b] text-white'
                      : 'bg-[#008b5b] hover:bg-[#007749] text-white'
                  }`}
                >
                  {isJustAdded ? (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Added!</span>
                    </>
                  ) : (
                    <>
                      <Plus size={15} />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Product Modal (Amazon / Flipkart Style Detail View) */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-4">
            <button
              type="button"
              onClick={() => setActiveModalItem(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-2 rounded-full bg-gray-100"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                {activeModalItem.type === 'project' ? 'Verified Carbon Project' : 'Biodegradable Product'}
              </span>
              <span className="text-xs font-black text-[#008b5b] bg-[#e4f7eb] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Zap size={12} />
                +{activeModalItem.creditsReward} Green Credits
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-black text-[#10243b]">
              {activeModalItem.name}
            </h3>
            <p className="text-xs text-[#53667b] font-medium">
              {activeModalItem.brand} · <span className="text-[#10243b]">{activeModalItem.category}</span>
            </p>

            {/* Modal Image */}
            {activeModalItem.imageUrl && (
              <div className="w-full h-56 rounded-2xl overflow-hidden border border-[#e8efed] shadow-2xs bg-gray-50">
                <img src={activeModalItem.imageUrl} alt={activeModalItem.name} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Price & Shipping */}
            <div className="flex items-center justify-between p-3 bg-[#f8fbfa] border border-[#e8efed] rounded-2xl">
              <div>
                <span className="text-[10px] text-[#53667b] uppercase block font-bold">List Price</span>
                <span className="text-xl font-black text-[#10243b]">{formatPrice(activeModalItem.price)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-700 uppercase block font-bold">Fulfillment</span>
                <span className="text-xs font-bold text-emerald-800">{activeModalItem.shippingInfo}</span>
              </div>
            </div>

            {/* Carbon & Biodegradable Metrics */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#e4f7eb] text-[#006b48] rounded-2xl border border-[#008b5b]/20">
                <span className="text-[10px] uppercase font-bold block opacity-85">Carbon Footprint</span>
                <span className="text-base font-black">{activeModalItem.footprint} kg CO2e</span>
              </div>
              <div className="p-3 bg-[#eef4f5] text-[#10243b] rounded-2xl border border-[#cbd8dc]">
                <span className="text-[10px] uppercase font-bold block opacity-85">CO2 Avoided</span>
                <span className="text-base font-black">+{activeModalItem.co2AvoidedKg} kg CO2</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h5 className="text-xs font-bold text-[#10243b]">Product Description & Biodegradability</h5>
              <p className="text-xs text-[#53667b] leading-relaxed">
                {activeModalItem.description}
              </p>
            </div>

            <div className="space-y-1.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                <ShieldCheck size={16} className="text-[#008b5b]" />
                <span>{activeModalItem.verificationBadge} ({activeModalItem.verificationId})</span>
              </div>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {activeModalItem.verificationDetails}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  addToCart(activeModalItem, 1);
                  setActiveModalItem(null);
                  onNavigate('Cart');
                }}
                className="flex-1 py-3.5 bg-[#008b5b] hover:bg-[#007749] text-white font-black text-sm rounded-2xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingCart size={18} />
                <span>Add to Cart & Checkout (+{activeModalItem.creditsReward} Credits)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="py-3.5 px-5 bg-gray-100 hover:bg-gray-200 text-[#10243b] font-bold text-xs rounded-2xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
