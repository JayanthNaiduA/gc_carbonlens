import React, { useState } from 'react';
import { GreenCard, ChoiceTabs, MessageBox, MetricRow, SectionTitle } from '../../components/common/CommonWidgets';
import { ProductArt } from '../../components/common/Visuals';
import {
  Camera,
  Upload,
  Receipt,
  Leaf,
  ChevronLeft,
  ChevronDown,
  Award,
  TreePine,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ConsentPreferences, ScanResultPayload, ProductItem } from '../../types';
import { INITIAL_PRODUCTS, VERIFIED_MARKET_ITEMS } from '../../data/mockData';
import { useCurrency } from '../../utils/currency';

interface ScanScreenProps {
  consent: ConsentPreferences;
  onNavigate: (page: string) => void;
  onScanCompleted?: (scanId: string) => void;
  onPointsUpdated?: (newPoints: number) => void;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({
  consent,
  onNavigate,
  onScanCompleted,
  onPointsUpdated,
}) => {
  const [modeIndex, setModeIndex] = useState(0); // 0: Product Scan, 1: Receipt Upload
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResultPayload | null>(null);
  const [showAccordion, setShowAccordion] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptFile, setReceiptFile] = useState<string | null>(null);
  const [receiptSuccessMsg, setReceiptSuccessMsg] = useState<string | null>(null);
  const { formatPrice } = useCurrency();

  // Recommended alternative product
  const recommendedProduct = VERIFIED_MARKET_ITEMS[2]; // Vacuum Insulated Steel Bottle

  const samplePlasticBottleResult: ScanResultPayload = {
    scan_id: 'scan-plastic-bottle-9912',
    status: 'COMPLETED',
    product_candidate: {
      product_ref: 'plastic_water_bottle',
      name: 'Single-Use Plastic Water Bottle (500ml)',
      brand: 'Conventional Beverage Co.',
      category: 'Beverages',
      footprint: 0.35,
      score: 42,
      icon: 'bottle',
      description: 'Single-use polyethylene terephthalate container with high lifecycle emissions and landfill persistence.',
      imageUrl: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80',
    },
    carbon: {
      estimated: 0.35,
      boundary: 'Cradle-to-grave with single-use plastic disposal footprint',
      method: 'activity_multiplier_v2.1',
      source: 'EcoInvent 3.9 & Global Plastics Audit',
      factorVersion: 'EF-2026-v2',
      confidence: 'High (Verified Third-Party Assessment)',
    },
    sustainability: {
      score: 42,
      version: 'score-policy-2026.1',
      dimensions: {
        carbon_intensity: 35,
        reusability: 10,
        packaging: 20,
        recyclability: 45,
        durability: 10,
      },
    },
  };

  const handlePlasticBottleScan = () => {
    setProcessing(true);
    setError(null);
    setTimeout(() => {
      setResult(samplePlasticBottleResult);
      setProcessing(false);
      onScanCompleted?.(samplePlasticBottleResult.scan_id);
    }, 500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!consent.camera) {
      setError('Enable camera consent in Settings before processing scan evidence.');
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleAnalyzeUpload = () => {
    if (!imagePreview) {
      setError('Please capture or upload an evidence photo first.');
      return;
    }
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setResult(samplePlasticBottleResult);
      onScanCompleted?.(samplePlasticBottleResult.scan_id);
    }, 600);
  };

  const handleReceiptUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      setError('Please attach the purchase receipt for the recommended bio-friendly product.');
      return;
    }
    setReceiptSuccessMsg('SUCCESS · Receipt verified! +160 Green Points credited to your wallet for this Green Buy.');
    if (onPointsUpdated) {
      onPointsUpdated(1420 + 160);
    }
    setTimeout(() => {
      setShowReceiptModal(false);
      setReceiptSuccessMsg(null);
      setReceiptFile(null);
    }, 2000);
  };

  // If result is active, render AI Scan Result with Bio-Friendly Recommendation
  if (result) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => {
            setResult(null);
            setImagePreview(null);
          }}
          className="text-xs sm:text-sm font-semibold text-[#008b5b] hover:text-[#007749] flex items-center gap-1"
        >
          <ChevronLeft size={16} /> New scan
        </button>

        {/* Scanned Plastic Product Analysis Card */}
        <GreenCard bgColor="bg-red-50/40" className="border-red-200">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-red-200">
              <img src={result.product_candidate.imageUrl} alt={result.product_candidate.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                High Plastic Footprint Detected
              </span>
              <h3 className="text-base sm:text-lg font-bold text-[#10243b] truncate mt-1">
                {result.product_candidate.name}
              </h3>
              <p className="text-xs text-[#53667b]">
                {result.product_candidate.brand} · Score: {result.sustainability.score}/100
              </p>
            </div>
          </div>
        </GreenCard>

        {/* Carbon Footprint */}
        <SectionTitle title="Carbon and Environmental Impact" />
        <GreenCard bgColor="bg-[#fff7df]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl text-amber-700 shadow-2xs shrink-0">
              <Leaf size={28} />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-[#10243b]">
                {result.carbon.estimated.toFixed(2)} kg CO2e per unit
              </div>
              <p className="text-xs text-amber-900 mt-0.5">{result.carbon.boundary}</p>
            </div>
          </div>
        </GreenCard>

        {/* AI Bio-Friendly Product Recommendation */}
        <SectionTitle title="AI Bio-Friendly Product Recommendation" />
        <GreenCard bgColor="bg-[#e4f7eb]" className="border-[#a9efc3]">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#008b5b]" />
              <span className="text-xs font-bold text-[#006b48] uppercase tracking-wider">
                Recommended Sustainable Swap
              </span>
            </div>

            <div className="flex items-center gap-4 bg-white p-3.5 rounded-2xl border border-[#a9efc3]">
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#e8efed]">
                <img src={recommendedProduct.imageUrl} alt={recommendedProduct.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-[#10243b] truncate">
                  {recommendedProduct.name}
                </h4>
                <p className="text-xs text-[#53667b]">
                  {recommendedProduct.brand} · Score: {recommendedProduct.score}/100
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-black text-[#10243b]">{formatPrice(recommendedProduct.price)}</span>
                  <span className="text-[10px] font-bold text-[#008b5b] bg-[#e4f7eb] px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <Zap size={10} />
                    +{recommendedProduct.creditsReward} Credits
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#006b48] leading-relaxed">
              Switching from single-use plastics to this verified bio-friendly product avoids over <strong>8.5 kg CO2e</strong> per lifecycle and unlocks instant rewards.
            </p>

            <button
              type="button"
              onClick={() => setShowReceiptModal(true)}
              className="w-full py-3 px-4 bg-[#008b5b] hover:bg-[#007749] text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              <Receipt size={16} />
              <span>Upload Receipt for Green Buy & Claim +{recommendedProduct.creditsReward} Credits</span>
            </button>
          </div>
        </GreenCard>

        {/* Method Accordion */}
        <div className="border border-[#e8efed] rounded-2xl bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAccordion(!showAccordion)}
            className="w-full p-4 flex items-center justify-between font-semibold text-xs sm:text-sm text-[#10243b] hover:bg-[#fafcfb]"
          >
            <span>Method, confidence & AI source</span>
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${showAccordion ? 'rotate-180' : ''}`}
            />
          </button>
          {showAccordion && (
            <div className="p-4 pt-0 text-xs text-[#53667b] space-y-1.5 border-t border-[#f0f4f2]">
              <p><strong>AI Recognition:</strong> Single-use polymer spectroscopic signature match.</p>
              <p><strong>Calculation method:</strong> {result.carbon.method}</p>
              <p><strong>Source data:</strong> {result.carbon.source}</p>
              <p><strong>Confidence rating:</strong> {result.carbon.confidence}</p>
            </div>
          )}
        </div>

        {/* Receipt Upload Modal */}
        {showReceiptModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-[#10243b]">Upload Receipt for Green Buy</h3>
              <p className="text-xs text-[#53667b]">
                Attach your purchase receipt for <strong>{recommendedProduct.name}</strong> to automatically claim your +{recommendedProduct.creditsReward} Green Points reward.
              </p>

              <form onSubmit={handleReceiptUploadSubmit} className="space-y-4">
                <div className="border-2 border-dashed border-[#dce7e2] hover:border-[#008b5b] rounded-2xl p-6 text-center bg-[#f6f9f8] transition cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setReceiptFile(e.target.files[0].name);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 bg-[#e4f7eb] text-[#008b5b] rounded-full">
                      <Upload size={24} />
                    </div>
                    <span className="text-xs font-bold text-[#10243b]">
                      {receiptFile ? receiptFile : 'Choose receipt image or PDF'}
                    </span>
                    <span className="text-[10px] text-[#53667b]">
                      AI parser verifies merchant, date and bio-friendly item match.
                    </span>
                  </div>
                </div>

                {receiptSuccessMsg && (
                  <MessageBox message={receiptSuccessMsg} />
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReceiptModal(false);
                      setReceiptSuccessMsg(null);
                      setReceiptFile(null);
                    }}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#10243b] font-semibold text-xs sm:text-sm rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-[#008b5b] hover:bg-[#007749] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs"
                  >
                    Verify & Claim Reward
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ChoiceTabs
        labels={['Product Scan', 'Receipt Upload']}
        selected={modeIndex}
        onChanged={(v) => {
          setModeIndex(v);
          setImagePreview(null);
          setError(null);
        }}
      />

      {/* Real Camera / Scan Viewfinder */}
      <div className="relative h-80 sm:h-96 rounded-3xl bg-gradient-to-b from-[#173a30] to-[#081c18] flex flex-col items-center justify-center overflow-hidden shadow-inner p-4">
        <div className="relative w-52 sm:w-60 h-64 sm:h-72 border-2 border-[#69d8a8] rounded-2xl flex items-center justify-center p-3 shadow-[0_0_15px_rgba(105,216,168,0.25)] overflow-hidden bg-black/40">
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Scan preview"
              className="w-full h-full object-cover rounded-xl"
            />
          ) : modeIndex === 0 ? (
            <div className="flex flex-col items-center text-center p-2">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-[#69d8a8]/40 mb-2 shadow-lg">
                <img src="https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=400&q=80" alt="Plastic water bottle" className="w-full h-full object-cover" />
              </div>
              <span className="text-xs font-bold text-white">Single-Use Plastic Bottle</span>
              <span className="text-[10px] text-[#a9efc3] mt-0.5">Ready for AI Bio-Match</span>
            </div>
          ) : (
            <Receipt className="w-20 h-20 text-white/70" />
          )}

          {/* Corner highlights */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-3 border-l-3 border-[#a9efc3]"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-3 border-r-3 border-[#a9efc3]"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-3 border-l-3 border-[#a9efc3]"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-3 border-r-3 border-[#a9efc3]"></div>
        </div>

        <span className="absolute top-4 text-xs sm:text-sm font-bold text-white tracking-wide">
          {modeIndex === 0 ? 'Live Camera Scan (Plastic Item)' : 'Receipt Upload for Green Buy'}
        </span>
        <span className="absolute bottom-3 text-[11px] text-white/60">
          AI computer vision & recommendation engine active
        </span>
      </div>

      {error && <MessageBox message={error} isError />}

      {/* Action triggers */}
      <div className="space-y-3">
        <p className="text-xs sm:text-sm text-[#53667b] leading-relaxed">
          Scan a conventional plastic item (like a single-use water bottle) to trigger our AI recommendation engine. When you buy the bio-friendly alternative and upload your receipt, rewards are automatically granted.
        </p>

        <button
          type="button"
          onClick={handlePlasticBottleScan}
          disabled={processing}
          className="w-full py-3.5 px-4 bg-[#008b5b] hover:bg-[#007749] text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
        >
          <Sparkles size={17} />
          {processing ? 'AI analyzing product & matching alternatives…' : 'Scan Plastic Water Bottle (Demo Scan)'}
        </button>

        {/* Real photo inputs */}
        <div className="pt-2">
          <label className="block text-xs font-semibold text-[#10243b] mb-2">
            Or upload photo / receipt file:
          </label>
          <div className="flex gap-2">
            <label className="flex-1 py-2.5 px-3 bg-white border border-[#dce7e2] hover:bg-[#f4f8f6] rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition">
              <Upload size={16} className="text-[#008b5b]" />
              Choose File
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {imagePreview && (
              <button
                type="button"
                onClick={handleAnalyzeUpload}
                disabled={processing}
                className="py-2.5 px-4 bg-[#10243b] hover:bg-[#1a385b] text-white text-xs sm:text-sm font-bold rounded-xl transition"
              >
                Analyze
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('Settings')}
          className="text-xs text-[#008b5b] hover:underline font-semibold block text-center pt-2"
        >
          Manage camera consent
        </button>
      </div>
    </div>
  );
};
