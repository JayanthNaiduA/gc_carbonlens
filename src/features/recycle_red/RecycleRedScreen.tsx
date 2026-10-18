import React, { useState } from 'react';
import {
  Laptop,
  Receipt,
  ShieldCheck,
  MapPin,
  Truck,
  Store,
  Zap,
  CheckCircle2,
  Clock,
  Camera,
  DollarSign,
  ArrowRight,
  Sparkles,
  Plus,
  FileText,
  UserCheck,
} from 'lucide-react';
import { GreenCard, SectionTitle, MessageBox, MetricRow, ChoiceTabs } from '../../components/common/CommonWidgets';
import { ConsentPreferences } from '../../types';
import { INITIAL_LEDGER_ENTRIES } from '../../data/mockData';
import { useCurrency } from '../../utils/currency';

interface RecycleRedScreenProps {
  consent: ConsentPreferences;
}

interface CertifiedVendor {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  rating: number;
  dropoffPriceMultiplier: number; // 1.0 (max price)
  courierPriceMultiplier: number; // 0.78 (less courier fee)
}

interface EWasteRequest {
  id: string;
  category: string;
  quantity: number;
  condition: string;
  photoUrl: string;
  createdAt: string;
  status: 'Quotes Received' | 'Quote Accepted' | 'Collection Scheduled' | 'Completed & Paid';
  selectedVendorId?: string;
  collectionMethod?: 'dropoff' | 'courier';
  finalPrice?: number;
  creditsEarned?: number;
}

export const RecycleRedScreen: React.FC<RecycleRedScreenProps> = ({ consent }) => {
  const [activeTab, setActiveTab] = useState<number>(0); // 0: Submit, 1: Tracker & Quotes, 2: Nearby Vendors
  const { currency, formatInrPrice } = useCurrency();

  // New Request Form State
  const [category, setCategory] = useState('Laptops & Computers');
  const [quantity, setQuantity] = useState('2');
  const [condition, setCondition] = useState('Working / Repairable');
  const [photoName, setPhotoName] = useState('ewaste-laptop-batch.jpg');
  const [message, setMessage] = useState<string | null>(null);

  // Active Requests Tracker State
  const [requests, setRequests] = useState<EWasteRequest[]>([
    {
      id: 'EW-2026-4412',
      category: 'Smartphones & Tablets (3x)',
      quantity: 3,
      condition: 'Old / Non-working',
      photoUrl: 'ewaste-phones.jpg',
      createdAt: '2026-10-16 14:20',
      status: 'Quotes Received',
    },
    {
      id: 'EW-2026-3810',
      category: 'Lithium-Ion Battery Pack',
      quantity: 1,
      condition: 'Used',
      photoUrl: 'battery.jpg',
      createdAt: '2026-10-15 09:10',
      status: 'Completed & Paid',
      selectedVendorId: 'vend-1',
      collectionMethod: 'dropoff',
      finalPrice: 3500,
      creditsEarned: 350, // 10% of 3500
    },
  ]);

  const certifiedVendors: CertifiedVendor[] = [
    {
      id: 'vend-1',
      name: 'EcoRecycle Hub Downtown',
      address: '420 Green Valley Road, Metro Central',
      distanceKm: 1.8,
      rating: 4.9,
      dropoffPriceMultiplier: 1.0,
      courierPriceMultiplier: 0.78,
    },
    {
      id: 'vend-2',
      name: 'GreenWave E-Waste Recovery',
      address: '108 Industrial Parkway, North District',
      distanceKm: 3.4,
      rating: 4.8,
      dropoffPriceMultiplier: 0.95,
      courierPriceMultiplier: 0.74,
    },
    {
      id: 'vend-3',
      name: 'Metro Circuit & Battery Recyclers',
      address: '75 East Market Street, Suite B',
      distanceKm: 5.1,
      rating: 4.7,
      dropoffPriceMultiplier: 0.92,
      courierPriceMultiplier: 0.70,
    },
  ];

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `EW-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newReq: EWasteRequest = {
      id: newId,
      category,
      quantity: parseInt(quantity, 10) || 1,
      condition,
      photoUrl: photoName || 'ewaste-item.jpg',
      createdAt: 'Just now',
      status: 'Quotes Received',
    };

    setRequests([newReq, ...requests]);
    setMessage(`E-Waste Request ID [${newId}] created successfully! Vendors are now reviewing and quoting their prices.`);
    setActiveTab(1); // Switch to Tracker & Quotes (position 2)
  };

  const handleSelectQuote = (reqId: string, vendorId: string, method: 'dropoff' | 'courier', baseEstPrice: number) => {
    const vendor = certifiedVendors.find((v) => v.id === vendorId);
    if (!vendor) return;

    const multiplier = method === 'dropoff' ? vendor.dropoffPriceMultiplier : vendor.courierPriceMultiplier;
    const finalPrice = Math.round(baseEstPrice * multiplier);
    // Max reward 2000 GP, calculated as 10% of total recycle value in INR
    const creditsEarned = Math.min(2000, Math.round(finalPrice * 0.10));

    // Inject into INITIAL_LEDGER_ENTRIES so it appears in Rewards history under its ID
    const ledgerExists = INITIAL_LEDGER_ENTRIES.find((e) => e.event_id === reqId);
    if (!ledgerExists) {
      INITIAL_LEDGER_ENTRIES.unshift({
        event_id: reqId,
        points_delta: creditsEarned,
        entry_type: 'VESTED',
        policy_version: 'recycle-red-v1',
        created_at: new Date().toISOString(),
      });
    }

    setRequests(
      requests.map((req) => {
        if (req.id === reqId) {
          return {
            ...req,
            status: 'Completed & Paid',
            selectedVendorId: vendorId,
            collectionMethod: method,
            finalPrice,
            creditsEarned,
          };
        }
        return req;
      })
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#8b0000] to-[#5a0000] text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-15 pointer-events-none">
          <Laptop size={180} />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-white mb-2 backdrop-blur-xs">
            <ShieldCheck size={14} className="text-red-200" />
            Certified E-Waste Recycling & Bidding (INR ₹)
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Recycle Red Marketplace
          </h2>
          <p className="text-xs sm:text-sm text-white/90 mt-1 max-w-xl leading-relaxed">
            Submit your e-waste details to generate a unique request ID. Certified nearby vendors quote in <span className="font-bold underline">Indian Rupees (₹)</span>. Earn <span className="font-bold underline">10% in Green Points (max 2000 GP)</span> based on total recycle value.
          </p>
        </div>
      </div>

      {/* Choice Tabs (Request Tracker & Quotes is at position 2 / index 1) */}
      <ChoiceTabs
        labels={['1. Submit E-Waste Request', '2. Request Tracker & Quotes', '3. Nearby Certified Vendors']}
        selected={activeTab}
        onChanged={(v) => {
          setActiveTab(v);
          setMessage(null);
        }}
      />

      {/* TAB 0: SUBMIT E-WASTE REQUEST */}
      {activeTab === 0 && (
        <form onSubmit={handleCreateRequest} className="bg-white p-4 sm:p-6 rounded-3xl border border-[#e8efed] space-y-4 shadow-xs">
          <SectionTitle title="New E-Waste Recycling Request" />
          <p className="text-xs text-[#53667b]">
            Provide details of your recyclable electronics to instantly receive competitive vendor bids in Indian Rupees (₹).
          </p>

          <div>
            <label className="block text-xs font-semibold text-[#10243b] mb-1">
              E-Waste Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full py-2.5 px-3 text-sm rounded-xl border border-[#dce7e2] bg-white focus:outline-hidden focus:border-[#008b5b] font-medium"
            >
              <option value="Laptops & Computers">Laptops & Computers</option>
              <option value="Smartphones & Tablets">Smartphones & Tablets</option>
              <option value="Household Small Appliances">Household Small Appliances</option>
              <option value="Lithium-Ion Batteries & UPS">Lithium-Ion Batteries & UPS</option>
              <option value="LCD / LED Monitors">LCD / LED Monitors</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#10243b] mb-1">
                Quantity (Units)
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full py-2.5 px-3 text-sm rounded-xl border border-[#dce7e2] focus:outline-hidden focus:border-[#008b5b]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#10243b] mb-1">
                Item Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full py-2.5 px-3 text-sm rounded-xl border border-[#dce7e2] bg-white focus:outline-hidden focus:border-[#008b5b] font-medium"
              >
                <option value="Working / Repairable">Working / Repairable</option>
                <option value="Used / Minor Faults">Used / Minor Faults</option>
                <option value="Non-working / Salvage">Non-working / Salvage</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#10243b] mb-1">
              Upload Item Photo
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={photoName}
                onChange={(e) => setPhotoName(e.target.value)}
                placeholder="e.g. photos/ewaste-item.jpg"
                className="flex-1 py-2.5 px-3 text-sm rounded-xl border border-[#dce7e2] focus:outline-hidden focus:border-[#008b5b]"
              />
              <span className="py-2.5 px-4 bg-gray-100 text-[#10243b] text-xs font-bold rounded-xl flex items-center gap-1 shrink-0">
                <Camera size={14} />
                Browse
              </span>
            </div>
          </div>

          {message && <MessageBox message={message} />}

          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-[#8b0000] hover:bg-[#700000] text-white font-black rounded-2xl text-sm transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles size={16} />
            <span>Generate Request ID & Get Quotes</span>
          </button>
        </form>
      )}

      {/* TAB 1: REQUEST TRACKER & QUOTES (2nd Position) */}
      {activeTab === 1 && (
        <div className="space-y-4">
          <SectionTitle title="E-Waste Request Tracker & Vendor Bids" />
          <p className="text-xs text-[#53667b]">
            Track your unique Request IDs. Vendor quotes display pickup and drop-off pricing on a single line in Indian Rupees (₹). Rewards award 10% in Green Points (max 2000 GP).
          </p>

          <div className="space-y-4">
            {requests.map((req) => {
              const baseEstPrice = req.quantity * 2500; // Base valuation in INR ₹

              return (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl border border-[#e8efed] p-5 space-y-4 shadow-xs"
                >
                  {/* Request Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#e8efed]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-[#8b0000] bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">
                          ID: {req.id}
                        </span>
                        <span className="text-xs text-[#53667b]">{req.createdAt}</span>
                      </div>
                      <h4 className="text-sm sm:text-base font-bold text-[#10243b] mt-1">
                        {req.category} ({req.quantity} units) · {req.condition}
                      </h4>
                    </div>

                    <span
                      className={`text-xs font-black px-3 py-1.5 rounded-full ${
                        req.status === 'Completed & Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : req.status === 'Collection Scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Status: {req.status}
                    </span>
                  </div>

                  {/* If quotes received, show vendor bidding list with Drop-off & Pickup on ONE LINE */}
                  {req.status === 'Quotes Received' && (
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold text-[#10243b]">
                        Certified Vendor Quotes ({currency}):
                      </h5>

                      <div className="grid grid-cols-1 gap-2.5">
                        {certifiedVendors.map((vendor) => {
                          const dropoffPrice = Math.round(baseEstPrice * vendor.dropoffPriceMultiplier);
                          const courierPrice = Math.round(baseEstPrice * vendor.courierPriceMultiplier);

                          return (
                            <div
                              key={vendor.id}
                              className="p-3.5 bg-[#f8fbfa] border border-[#e8efed] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                            >
                              {/* Vendor Name & Distance on One Line */}
                              <div className="flex flex-wrap items-center gap-2 min-w-0">
                                <span className="font-bold text-[#10243b]">{vendor.name}</span>
                                <span className="text-[#53667b] text-[11px]">({vendor.distanceKm} km away · ★ {vendor.rating})</span>
                              </div>

                              {/* Pickup & Drop-off Prices on One Line */}
                              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-[#53667b]">Pickup: <strong className="text-[#10243b]">{formatInrPrice(courierPrice)}</strong></span>
                                  <span className="text-gray-300">|</span>
                                  <span className="text-[11px] text-[#53667b]">Drop-off: <strong className="text-[#008b5b]">{formatInrPrice(dropoffPrice)}</strong></span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectQuote(req.id, vendor.id, 'courier', baseEstPrice)}
                                    className="py-1 px-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-xl cursor-pointer"
                                  >
                                    Accept Pickup
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleSelectQuote(req.id, vendor.id, 'dropoff', baseEstPrice)}
                                    className="py-1 px-2.5 bg-[#008b5b] hover:bg-[#007749] text-white font-bold text-[11px] rounded-xl cursor-pointer"
                                  >
                                    Accept Drop-off
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* If completed or paid */}
                  {req.status === 'Completed & Paid' && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-emerald-900 block text-sm">
                          Finalized Payout: {formatInrPrice(req.finalPrice || 0)} ({req.collectionMethod === 'dropoff' ? 'Customer Shop Drop-off' : 'Courier Partner Collection'})
                        </span>
                        <span className="text-[11px] text-emerald-800">
                          Vendor: {certifiedVendors.find((v) => v.id === req.selectedVendorId)?.name} · <strong>+{req.creditsEarned} Green Points (10% value, max 2000 GP)</strong> added under ID {req.id}
                        </span>
                      </div>
                      <span className="px-3 py-1.5 bg-[#008b5b] text-white font-black rounded-xl shrink-0 flex items-center gap-1">
                        <Zap size={14} />
                        +{req.creditsEarned} GP Credited
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: NEARBY CERTIFIED VENDORS (3rd Position) */}
      {activeTab === 2 && (
        <div className="space-y-3">
          <SectionTitle title="Nearby Certified E-Waste Vendors" />
          <p className="text-xs text-[#53667b]">
            Drop your items directly at vendor shops to get the <span className="font-bold text-[#10243b]">maximum price in Indian Rupees (₹)</span>, or request a courier pickup.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {certifiedVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="bg-white rounded-3xl border border-[#e8efed] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs hover:border-[#8b0000]/40 transition"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-3 bg-red-50 text-[#8b0000] rounded-2xl shrink-0">
                    <Store size={22} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                        Certified Facility
                      </span>
                      <span className="text-xs font-bold text-amber-600">★ {vendor.rating}</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-[#10243b] truncate mt-0.5">
                      {vendor.name}
                    </h4>
                    <p className="text-xs text-[#53667b] flex items-center gap-1 mt-0.5">
                      <MapPin size={13} className="shrink-0" />
                      <span>{vendor.address} ({vendor.distanceKm} km away)</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-col items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#e8efed]">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-[#53667b] block uppercase font-bold">Drop-off Payout</span>
                    <span className="text-xs sm:text-sm font-black text-[#008b5b]">
                      Up to {vendor.dropoffPriceMultiplier * 100}% Max Value ({currency === 'INR' ? '₹' : `${currency} / ₹`})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab(1)}
                    className="py-2 px-3.5 bg-[#8b0000] hover:bg-[#700000] text-white font-bold text-xs rounded-xl transition shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Quotes & Sell</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-[#53667b]">
        All e-waste transactions carry a unique tracking ID to ensure transparent vendor quoting, eco-compliance, and secure payout.
      </p>
    </div>
  );
};
