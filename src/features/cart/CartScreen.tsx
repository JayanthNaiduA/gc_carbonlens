import React, { useState } from 'react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  TreePine,
  Package,
  Award,
  CreditCard,
  History,
  Store,
  ExternalLink,
  ChevronRight,
  X,
} from 'lucide-react';
import { GreenCard, ChoiceTabs, SectionTitle } from '../../components/common/CommonWidgets';
import { ProductArt } from '../../components/common/Visuals';
import { useCart } from './CartContext';
import { VERIFIED_MARKET_ITEMS } from '../../data/mockData';
import { GreenMarketItem, OrderRecord, User } from '../../types';
import { useCurrency } from '../../utils/currency';

interface CartScreenProps {
  user: User;
  onNavigate: (page: string) => void;
  onPointsUpdated?: (newPoints: number) => void;
}

export const CartScreen: React.FC<CartScreenProps> = ({
  user,
  onNavigate,
  onPointsUpdated,
}) => {
  const {
    items,
    cartCount,
    totalAmount,
    totalCreditsReward,
    totalCo2Avoided,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    checkout,
    orders,
    lastCelebratedOrder,
    setLastCelebratedOrder,
  } = useCart();

  const [activeTab, setActiveTab] = useState<number>(0); // 0: Cart, 1: Browse Store, 2: History
  const [selectedPayment, setSelectedPayment] = useState<'ecopay' | 'card' | 'gpay'>('ecopay');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState<boolean>(false);
  const [verificationStep, setVerificationStep] = useState<number>(0);
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [activeModalItem, setActiveModalItem] = useState<GreenMarketItem | null>(null);
  const { formatPrice } = useCurrency();

  const handleCheckoutSubmit = async () => {
    if (items.length === 0) return;
    setIsProcessingCheckout(true);
    setVerificationStep(1);

    // Step 1: Verification check
    setTimeout(() => {
      setVerificationStep(2);
    }, 900);

    // Step 2: Depositing credits automatically
    setTimeout(async () => {
      setVerificationStep(3);
      try {
        const order = await checkout(user, selectedPayment === 'ecopay' ? 'CarbonLens Instant EcoPay' : selectedPayment === 'card' ? 'Visa •••• 4242' : 'Google Pay');
        if (onPointsUpdated) {
          onPointsUpdated(1420 + order.credits_earned);
        }
      } catch (err) {
        console.error('Checkout error:', err);
      } finally {
        setTimeout(() => {
          setIsProcessingCheckout(false);
          setVerificationStep(0);
        }, 1200);
      }
    }, 2000);
  };

  const filteredCatalog = VERIFIED_MARKET_ITEMS.filter((item) => {
    if (selectedStoreFilter === 'All') return true;
    if (selectedStoreFilter === 'Personal Care') return item.category === 'Personal Care';
    if (selectedStoreFilter === 'Home & Kitchen') return item.category === 'Home' || item.category === 'Home & Kitchen';
    if (selectedStoreFilter === 'Food & Grocery') return item.category === 'Food' || item.category === 'Food & Grocery';
    if (selectedStoreFilter === 'Zero Waste Essentials') return item.category === 'Zero Waste Essentials';
    return item.category === selectedStoreFilter;
  }).sort((a, b) => {
    if (sortBy === 'credits-desc') return b.creditsReward - a.creditsReward;
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating-desc') return (b.rating || 4.5) - (a.rating || 4.5);
    if (sortBy === 'co2-desc') return b.co2AvoidedKg - a.co2AvoidedKg;
    return 0; // recommended
  });

  return (
    <div className="space-y-4">
      {/* Platform Certified Guarantee Hero */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#008b5b] to-[#015e3e] text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-15 pointer-events-none">
          <ShoppingCart size={180} />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-white mb-2 backdrop-blur-xs">
            <ShieldCheck size={14} className="text-[#a9efc3]" />
            CarbonLens Verified Guarantee
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Green Cart & Verified Store
          </h2>
          <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-xl leading-relaxed">
            Purchase verified sustainable, plastic-free products. When verified by our platform, <span className="font-bold underline decoration-[#a9efc3] text-white">credits are deposited automatically</span> to your Rewards wallet!
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-white/20 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-white/90">
              <Zap size={15} className="text-[#a9efc3]" />
              Instant Credit Award
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-white/90">
              <TreePine size={15} className="text-[#a9efc3]" />
              Audit-Backed Projects
            </div>
            <div className="flex items-center gap-1.5 font-semibold text-white/90">
              <Sparkles size={15} className="text-[#a9efc3]" />
              Immutable Ledger
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: My Cart / Browse Store / Order History */}
      <div className="flex w-full gap-1.5 p-1 bg-[#eef4f5] rounded-xl">
        <button
          type="button"
          onClick={() => setActiveTab(0)}
          className={`flex-1 py-2 sm:py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
            activeTab === 0
              ? 'bg-[#008b5b] text-white shadow-xs'
              : 'text-[#10243b] hover:bg-[#e2ebe9]'
          }`}
        >
          <ShoppingCart size={15} />
          <span>My Cart</span>
          {cartCount > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 0 ? 'bg-white text-[#008b5b]' : 'bg-[#008b5b] text-white'
              }`}
            >
              {cartCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(1)}
          className={`flex-1 py-2 sm:py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
            activeTab === 1
              ? 'bg-[#008b5b] text-white shadow-xs'
              : 'text-[#10243b] hover:bg-[#e2ebe9]'
          }`}
        >
          <Store size={15} />
          <span>Browse Verified</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(2)}
          className={`flex-1 py-2 sm:py-2.5 px-2 text-xs sm:text-sm font-semibold rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
            activeTab === 2
              ? 'bg-[#008b5b] text-white shadow-xs'
              : 'text-[#10243b] hover:bg-[#e2ebe9]'
          }`}
        >
          <History size={15} />
          <span>History & Credits</span>
          {orders.length > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 2 ? 'bg-white text-[#008b5b]' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {orders.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 0: CART VIEW */}
      {activeTab === 0 && (
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#e8efed] p-8 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-[#e4f7eb] text-[#008b5b] mx-auto flex items-center justify-center">
                <ShoppingCart size={32} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#10243b]">
                  Your Green Cart is Empty
                </h3>
                <p className="text-xs sm:text-sm text-[#53667b] max-w-sm mx-auto mt-1">
                  Add verified eco products or platform-verified green projects to start earning automatic credits.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab(1)}
                className="py-3 px-6 bg-[#008b5b] hover:bg-[#007749] text-white font-bold rounded-xl text-sm transition shadow-sm inline-flex items-center gap-2"
              >
                <Store size={16} />
                Browse Verified Items
              </button>

              {/* Quick Add Highlights */}
              <div className="pt-6 border-t border-[#e8efed] text-left">
                <span className="text-xs font-bold text-[#10243b] uppercase tracking-wider block mb-3">
                  Quick Add: Verified Community Favorites
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {VERIFIED_MARKET_ITEMS.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#f8fbfa] hover:bg-[#eef4f5] border border-[#e8efed] rounded-2xl flex items-center justify-between gap-2 transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.imageUrl ? (
                          <div className="w-[42px] h-[42px] rounded-xl overflow-hidden shrink-0 border border-[#e8efed]">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <ProductArt kind={item.icon} size={42} />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#10243b] truncate">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-bold text-[#10243b]">
                              {formatPrice(item.price)}
                            </span>
                            <span className="text-[10px] font-bold text-[#008b5b] bg-[#e4f7eb] px-1.5 py-0.2 rounded-md">
                              +{item.creditsReward} GP
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCart(item, 1)}
                        className="p-2 bg-[#008b5b] hover:bg-[#007749] text-white rounded-xl shadow-xs shrink-0 transition"
                        title="Add to Cart"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cart Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-[#53667b] uppercase tracking-wider">
                    {cartCount} {cartCount === 1 ? 'item' : 'items'} in cart
                  </span>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs text-red-500 hover:text-red-700 font-semibold"
                  >
                    Clear Cart
                  </button>
                </div>

                {items.map((item) => (
                  <GreenCard key={item.id} padding="p-3.5 sm:p-4">
                    <div className="flex items-start gap-3.5">
                      {item.imageUrl ? (
                        <div className="w-[64px] h-[64px] rounded-2xl overflow-hidden shrink-0 border border-[#e8efed] shadow-2xs">
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <ProductArt kind={item.icon} size={64} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                              item.type === 'project'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {item.type === 'project' ? 'Verified Project' : 'Eco Product'}
                          </span>
                          <span className="text-[10px] text-[#53667b] truncate">
                            {item.brand}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-[#10243b] truncate mt-0.5">
                          {item.name}
                        </h4>

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-black text-[#10243b]">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          <span className="text-[10px] text-[#53667b]">
                            ({formatPrice(item.price)} ea)
                          </span>
                          <span className="text-[10px] font-bold text-[#008b5b] bg-[#e4f7eb] px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            <Zap size={10} />
                            +{item.creditsReward * item.quantity} Credits
                          </span>
                        </div>

                        <p className="text-[10px] text-[#899ba8] mt-1 flex items-center gap-1">
                          <ShieldCheck size={11} className="text-[#008b5b]" />
                          <span>{item.verificationBadge}</span>
                        </p>
                      </div>

                      {/* Quantity & Delete Controls */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded transition"
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>

                        <div className="flex items-center border border-[#e8efed] bg-[#f8fbfa] rounded-xl overflow-hidden shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-1 text-gray-500 hover:bg-gray-200"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="px-2 text-xs font-bold text-[#10243b]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 text-[#008b5b] hover:bg-[#e4f7eb]"
                            aria-label="Increase quantity"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </GreenCard>
                ))}
              </div>

              {/* Order Summary Card */}
              <div className="bg-white rounded-3xl border border-[#e8efed] p-5 sm:p-6 space-y-4 shadow-sm">
                <h3 className="text-sm sm:text-base font-bold text-[#10243b] pb-2 border-b border-[#e8efed]">
                  Order & Automatic Credits Summary
                </h3>

                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between text-[#53667b]">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-[#10243b]">{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-[#53667b]">
                    <span>Platform Verification Fee</span>
                    <span className="font-semibold text-[#008b5b]">FREE ({formatPrice(0)})</span>
                  </div>
                  <div className="flex justify-between text-[#53667b]">
                    <span>Estimated CO2e Avoided</span>
                    <span className="font-semibold text-[#10243b]">{totalCo2Avoided} kg CO2e</span>
                  </div>
                  <div className="pt-2 border-t border-[#e8efed] flex justify-between text-sm sm:text-base font-black text-[#10243b]">
                    <span>Total Amount</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                {/* Automatic Credit Award Callout */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#e4f7eb] to-[#d8f3e5] border border-[#a9efc3] flex items-center gap-3">
                  <div className="p-2 bg-[#008b5b] text-white rounded-xl shrink-0 shadow-xs">
                    <Award size={22} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#006b48] uppercase tracking-wider block">
                      Automatic Credit Payout
                    </span>
                    <div className="text-sm sm:text-base font-black text-[#006b48]">
                      +{totalCreditsReward} Green Credits
                    </div>
                    <span className="text-[10px] text-[#53667b] block">
                      Verified by platform • Automatically deposited upon purchase
                    </span>
                  </div>
                </div>

                {/* Payment Selection */}
                <div className="space-y-2 pt-1">
                  <label className="text-xs font-bold text-[#10243b] block">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPayment('ecopay')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                        selectedPayment === 'ecopay'
                          ? 'border-[#008b5b] bg-[#e4f7eb] text-[#008b5b]'
                          : 'border-[#e8efed] bg-[#f8fbfa] text-[#53667b] hover:bg-white'
                      }`}
                    >
                      <Zap size={16} />
                      <span>Instant EcoPay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPayment('card')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                        selectedPayment === 'card'
                          ? 'border-[#008b5b] bg-[#e4f7eb] text-[#008b5b]'
                          : 'border-[#e8efed] bg-[#f8fbfa] text-[#53667b] hover:bg-white'
                      }`}
                    >
                      <CreditCard size={16} />
                      <span>Credit Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPayment('gpay')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${
                        selectedPayment === 'gpay'
                          ? 'border-[#008b5b] bg-[#e4f7eb] text-[#008b5b]'
                          : 'border-[#e8efed] bg-[#f8fbfa] text-[#53667b] hover:bg-white'
                      }`}
                    >
                      <Package size={16} />
                      <span>Google Pay</span>
                    </button>
                  </div>
                </div>

                {/* Checkout Action Button */}
                <button
                  type="button"
                  onClick={handleCheckoutSubmit}
                  disabled={isProcessingCheckout}
                  className="w-full py-4 px-4 bg-[#008b5b] hover:bg-[#007749] text-white font-black rounded-2xl text-sm sm:text-base transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck size={20} />
                  <span>Buy & Claim +{totalCreditsReward} Credits</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: BROWSE VERIFIED STORE */}
      {activeTab === 1 && (
        <div className="space-y-4">
          {/* Filters & Sorting Bar */}
          <div className="bg-white rounded-2xl border border-[#e8efed] p-3 space-y-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {(['All', 'Personal Care', 'Home & Kitchen', 'Food & Grocery', 'Zero Waste Essentials'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedStoreFilter(cat)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition ${
                      selectedStoreFilter === cat
                        ? 'bg-[#008b5b] text-white'
                        : 'bg-[#f8fbfa] border border-[#e8efed] text-[#53667b] hover:text-[#10243b]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#53667b] font-medium">Sort by:</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredCatalog.map((item) => {
              const inCart = items.find((i) => i.id === item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-[#e8efed] p-4 flex flex-col justify-between shadow-xs hover:border-[#008b5b]/60 transition relative overflow-hidden"
                >
                  {/* Discount tag badge if available */}
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
                        {item.type === 'project' ? 'Verified Project' : 'Verified Product'}
                      </span>
                      {/* Prominent Green Credits Badge */}
                      <span className="text-[11px] font-black text-[#008b5b] bg-[#e4f7eb] px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#008b5b]/30 shadow-2xs">
                        <Zap size={12} className="text-[#008b5b]" />
                        +{item.creditsReward} Green Credits
                      </span>
                    </div>

                    <div
                      className="cursor-pointer"
                      onClick={() => setActiveModalItem(item)}
                    >
                      <div className="flex justify-center my-3 relative">
                        {item.imageUrl ? (
                          <div className="w-full h-40 rounded-2xl overflow-hidden border border-[#e8efed] shadow-2xs bg-gray-50">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                          </div>
                        ) : (
                          <ProductArt kind={item.icon} size={80} />
                        )}
                      </div>

                      {/* Amazon/Flipkart style Rating & Reviews */}
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md text-[11px] font-bold border border-amber-200">
                          <span>★ {item.rating || 4.8}</span>
                        </div>
                        <span className="text-[11px] text-[#53667b]">({item.reviewsCount || 1200}+ ratings)</span>
                      </div>

                      <h4 className="text-sm font-bold text-[#10243b] line-clamp-1 hover:text-[#008b5b] transition">
                        {item.name}
                      </h4>
                      <p className="text-xs text-[#53667b]">
                        {item.brand} · <span className="font-semibold text-[#10243b]">{item.category}</span>
                      </p>

                      {/* Shipping info */}
                      <p className="text-[11px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                        <Package size={12} />
                        {item.shippingInfo || 'Amazon Choice · FREE Next-Day Delivery'}
                      </p>

                      <p className="text-xs text-[#62778a] line-clamp-2 mt-1.5 leading-relaxed">
                        {item.description}
                      </p>

                      <div className="mt-2.5 text-[10px] text-[#008b5b] font-medium flex items-center gap-1 bg-[#f8fbfa] p-2 rounded-xl border border-[#e8efed]">
                        <ShieldCheck size={13} className="shrink-0 text-[#008b5b]" />
                        <span className="truncate">{item.verificationBadge} · {item.co2AvoidedKg}kg CO₂ Avoided</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#e8efed] flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-[#53667b] block uppercase tracking-wider">Price</span>
                      <span className="text-base font-black text-[#10243b]">
                        {formatPrice(item.price)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => addToCart(item, 1)}
                      className={`py-2 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                        inCart
                          ? 'bg-[#e4f7eb] text-[#008b5b] border border-[#008b5b]/30'
                          : 'bg-[#008b5b] hover:bg-[#007749] text-white shadow-xs'
                      }`}
                    >
                      {inCart ? (
                        <>
                          <CheckCircle2 size={14} />
                          <span>Added ({inCart.quantity})</span>
                        </>
                      ) : (
                        <>
                          <Plus size={14} />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ORDER HISTORY & CREDIT LEDGER */}
      {activeTab === 2 && (
        <div className="space-y-3">
          <SectionTitle title="Verified Purchases & Automatic Credits Ledger" />

          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#e8efed] p-8 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-full bg-[#f8fbfa] text-[#899ba8] mx-auto flex items-center justify-center">
                <History size={28} />
              </div>
              <h4 className="text-sm font-bold text-[#10243b]">No Orders Yet</h4>
              <p className="text-xs text-[#53667b] max-w-xs mx-auto">
                Once you purchase verified products or projects, they will be registered here along with proof of automated credit deposit.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab(1)}
                className="py-2.5 px-4 bg-[#008b5b] text-white text-xs font-bold rounded-xl"
              >
                Explore Green Items
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <GreenCard key={order.order_id} padding="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#e8efed]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#10243b]">
                          Order #{order.order_id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] font-extrabold text-[#008b5b] bg-[#e4f7eb] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          {order.verification_status}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#53667b]">
                        {new Date(order.created_at).toLocaleString()} · {order.payment_method}
                      </span>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-base font-black text-[#10243b]">
                        {formatPrice(order.total_amount)}
                      </div>
                      <div className="text-xs font-bold text-[#008b5b] flex items-center sm:justify-end gap-1">
                        <Award size={13} />
                        +{order.credits_earned} Credits Earned
                      </div>
                    </div>
                  </div>

                  {/* Purchased items list */}
                  <div className="pt-3 space-y-1.5">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs text-[#53667b]"
                      >
                        <span className="truncate">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-semibold text-[#10243b]">
                          {formatPrice(item.price * item.quantity)} · +{item.credits_reward} GP
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Verification Seal footer */}
                  <div className="mt-3 pt-2.5 border-t border-[#f0f4f3] flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#899ba8]">
                    <span>Cert Hash: {order.verification_hash}</span>
                    <span>CO2e Avoided: {order.co2_avoided_kg} kg</span>
                  </div>
                </GreenCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CHECKOUT VERIFICATION MODAL */}
      {isProcessingCheckout && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-full bg-[#e4f7eb] text-[#008b5b] mx-auto flex items-center justify-center shadow-inner">
              {verificationStep < 3 ? (
                <div className="w-8 h-8 border-3 border-[#008b5b] border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 size={36} className="text-[#008b5b] animate-bounce" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#10243b]">
                {verificationStep === 1 && 'Verifying Green Credentials…'}
                {verificationStep === 2 && 'Confirming Platform Audit…'}
                {verificationStep === 3 && 'Automatic Credits Awarded!'}
              </h3>
              <p className="text-xs text-[#53667b] mt-1">
                {verificationStep === 1 && 'Validating cryptographic lifecycle certificate on CarbonLens.'}
                {verificationStep === 2 && 'Executing real-time automated reward contract.'}
                {verificationStep === 3 && `Depositing +${totalCreditsReward} Green Credits directly into your wallet.`}
              </p>
            </div>

            <div className="p-3 bg-[#f8fbfa] border border-[#e8efed] rounded-2xl text-xs space-y-2 text-left">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className={verificationStep >= 1 ? 'text-[#008b5b]' : 'text-gray-300'} />
                <span className={verificationStep >= 1 ? 'font-semibold text-[#10243b]' : 'text-gray-400'}>
                  1. Secure Merchant Handoff
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className={verificationStep >= 2 ? 'text-[#008b5b]' : 'text-gray-300'} />
                <span className={verificationStep >= 2 ? 'font-semibold text-[#10243b]' : 'text-gray-400'}>
                  2. Platform Eco Verification
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className={verificationStep >= 3 ? 'text-[#008b5b]' : 'text-gray-300'} />
                <span className={verificationStep >= 3 ? 'font-bold text-[#008b5b]' : 'text-gray-400'}>
                  3. Automated Credit Wallet Deposit
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CELEBRATION MODAL AFTER ORDER */}
      {lastCelebratedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setLastCelebratedOrder(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 rounded-full bg-[#e4f7eb] text-[#008b5b] mx-auto flex items-center justify-center shadow-xs">
              <Award size={36} />
            </div>

            <div>
              <span className="text-[11px] font-bold text-[#008b5b] uppercase tracking-wider">
                Platform Verification Passed ✓
              </span>
              <h3 className="text-xl font-black text-[#10243b] mt-0.5">
                +{lastCelebratedOrder.credits_earned} Green Credits!
              </h3>
              <p className="text-xs text-[#53667b] mt-1 leading-relaxed">
                Your purchase of verified green items was authenticated. Credits have been automatically credited to your wallet balance.
              </p>
            </div>

            <div className="p-3 bg-[#f8fbfa] border border-[#e8efed] rounded-2xl text-xs space-y-1.5 text-left">
              <div className="flex justify-between">
                <span className="text-[#53667b]">Order ID:</span>
                <span className="font-bold text-[#10243b]">#{lastCelebratedOrder.order_id.slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#53667b]">Credits Awarded:</span>
                <span className="font-bold text-[#008b5b]">+{lastCelebratedOrder.credits_earned} GP (Vested)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#53667b]">CO2e Avoided:</span>
                <span className="font-bold text-[#10243b]">{lastCelebratedOrder.co2_avoided_kg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#53667b]">Verification Hash:</span>
                <span className="font-mono text-[10px] text-gray-600">{lastCelebratedOrder.verification_hash}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setLastCelebratedOrder(null);
                  onNavigate('Rewards');
                }}
                className="w-full py-3 bg-[#008b5b] hover:bg-[#007749] text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-sm flex items-center justify-center gap-2"
              >
                <Award size={16} />
                <span>View in Rewards Wallet</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLastCelebratedOrder(null);
                  setActiveTab(1);
                }}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-[#10243b] font-semibold rounded-xl text-xs transition"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ITEM DETAILS MODAL */}
      {activeModalItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center">
            <button
              type="button"
              onClick={() => setActiveModalItem(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="my-2 flex justify-center">
              <ProductArt kind={activeModalItem.icon} size={100} />
            </div>

            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span
                className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                  activeModalItem.type === 'project'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {activeModalItem.type === 'project' ? 'Verified Project' : 'Verified Product'}
              </span>
            </div>

            <h3 className="text-lg font-bold text-[#10243b]">
              {activeModalItem.name}
            </h3>
            <p className="text-xs text-[#53667b] font-medium">
              {activeModalItem.brand} · {activeModalItem.category}
            </p>

            <div className="my-3 p-3 bg-[#f8fbfa] border border-[#e8efed] rounded-xl text-xs text-[#404c5e] text-left leading-relaxed">
              {activeModalItem.description}
            </div>

            <div className="p-2.5 bg-[#e4f7eb] text-[#006b48] rounded-xl text-xs text-left mb-3">
              <div className="font-bold flex items-center gap-1 mb-0.5">
                <ShieldCheck size={14} />
                <span>Verification Certificate</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {activeModalItem.verificationDetails}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 my-3 text-xs font-semibold">
              <div className="p-2 bg-[#f0f7f4] rounded-xl text-left">
                <span className="text-[10px] text-[#53667b] block">Price</span>
                <span className="text-sm font-bold text-[#10243b]">
                  {formatPrice(activeModalItem.price)}
                </span>
              </div>
              <div className="p-2 bg-[#e4f7eb] rounded-xl text-left">
                <span className="text-[10px] text-[#006b48] block">Automatic Credits</span>
                <span className="text-sm font-bold text-[#006b48]">
                  +{activeModalItem.creditsReward} GP
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                addToCart(activeModalItem, 1);
                setActiveModalItem(null);
                setActiveTab(0);
              }}
              className="w-full py-3 bg-[#008b5b] hover:bg-[#007749] text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-sm flex items-center justify-center gap-2"
            >
              <ShoppingCart size={16} />
              <span>Add to Cart & Earn Credits</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
