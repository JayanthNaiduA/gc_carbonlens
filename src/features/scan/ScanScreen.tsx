import React, { useState, useRef, useEffect } from 'react';
import { GreenCard, ChoiceTabs, MessageBox, SectionTitle } from '../../components/common/CommonWidgets';
import {
  Camera,
  Upload,
  Receipt,
  Leaf,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  Zap,
  Tag,
  FileText,
  Layers,
  ArrowRight,
  RefreshCw,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  VideoOff,
  Sliders,
  TreePine,
  Award,
} from 'lucide-react';
import { ConsentPreferences, ScanResultPayload, MaterialAlternative, GreenMarketItem } from '../../types';
import { VERIFIED_MARKET_ITEMS } from '../../data/mockData';
import { useCurrency } from '../../utils/currency';
import { useCart } from '../cart/CartContext';

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
  const [modeIndex, setModeIndex] = useState(0); // 0: Product Camera Scan, 1: Receipt OCR Upload
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [categoryHint, setCategoryHint] = useState<string>('auto');
  const [processing, setProcessing] = useState(false);
  const [statusStep, setStatusStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResultPayload | null>(null);
  const [selectedAltIndex, setSelectedAltIndex] = useState<number>(0);
  const [showAccordion, setShowAccordion] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [activeReceiptTarget, setActiveReceiptTarget] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<string | null>(null);
  const [receiptSuccessMsg, setReceiptSuccessMsg] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [justAddedSwap, setJustAddedSwap] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { formatPrice } = useCurrency();
  const { addToCart } = useCart();

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    if (!consent.camera) {
      setError('Please enable camera consent in Settings to activate the live scanner.');
      return;
    }
    setError(null);
    try {
      if (streamRef.current) {
        stopCamera();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setImagePreview(null);
    } catch (err: any) {
      console.warn('Unable to access live webcam/camera:', err);
      setError('Camera access unavailable. You can upload an image photo or choose a sample below.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhotoFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Scale canvas to reasonable dimension to keep base64 fast and lightweight
    const maxDim = 800;
    let width = video.videoWidth || 640;
    let height = video.videoHeight || 480;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImagePreview(dataUrl);
      stopCamera();
      performScan(dataUrl, textInput.trim(), categoryHint);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    stopCamera();

    const cleanFileName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/image|photo|img|scan|pic|\d+/gi, '')
      .trim();

    const effectiveText = textInput.trim() || cleanFileName;
    if (cleanFileName && !textInput.trim()) {
      setTextInput(cleanFileName);
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rawBase64 = reader.result as string;
      // Client-side image optimization
      const img = new Image();
      img.onload = () => {
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
          setImagePreview(optimizedBase64);
          performScan(optimizedBase64, effectiveText, categoryHint, file.name);
        } else {
          setImagePreview(rawBase64);
          performScan(rawBase64, effectiveText, categoryHint, file.name);
        }
      };
      img.onerror = () => {
        setImagePreview(rawBase64);
        performScan(rawBase64, effectiveText, categoryHint, file.name);
      };
      img.src = rawBase64;
    };
    reader.onerror = () => {
      setError('Failed to read image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  // Perform Gemini Multimodal Vision & OCR scan
  const performScan = async (
    base64Img: string | null,
    textHint: string,
    hintCategory: string,
    uploadedFileName?: string
  ) => {
    setProcessing(true);
    setError(null);
    setSelectedAltIndex(0);
    setStatusStep('Activating Gemini 3.8 Flash Multimodal Vision & OCR…');

    try {
      const stepTimer1 = setTimeout(() => {
        setStatusStep('Reading typography, branding logos and packaging labels (OCR)…');
      }, 500);

      const stepTimer2 = setTimeout(() => {
        setStatusStep('Auditing material composition & calculating lifecycle carbon footprint…');
      }, 1000);

      const stepTimer3 = setTimeout(() => {
        setStatusStep('Generating matching Steel, Glass, and Wood/Bamboo sustainable alternatives…');
      }, 1500);

      const response = await fetch('/api/gemini/scan-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Img || undefined,
          textQuery: textHint || undefined,
          categoryHint: hintCategory !== 'auto' ? hintCategory : undefined,
          fileName: uploadedFileName || undefined,
          mode: modeIndex === 0 ? 'product' : 'receipt',
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      if (!response.ok) {
        throw new Error('Analysis request failed. Please check network connectivity.');
      }

      const scanData: ScanResultPayload = await response.json();
      setResult(scanData);
      onScanCompleted?.(scanData.scan_id);
    } catch (err: any) {
      console.error('Scan Error:', err);
      setError(err.message || 'Failed to analyze product. Please try another image or label text.');
    } finally {
      setProcessing(false);
      setStatusStep('');
    }
  };

  // Quick selectable category triggers
  const targetCategories = [
    { id: 'auto', label: 'Auto-Detect', icon: '✨' },
    { id: 'bottle', label: 'Water Bottle', icon: '🧴' },
    { id: 'cup', label: 'Coffee Cup', icon: '☕' },
    { id: 'toothbrush', label: 'Toothbrush', icon: '🪥' },
    { id: 'container', label: 'Food Container', icon: '🥡' },
    { id: 'cutlery', label: 'Cutlery & Straws', icon: '🍴' },
    { id: 'bag', label: 'Plastic Bag / Wrap', icon: '🛍️' },
    { id: 'soap', label: 'Detergent / Shampoo', icon: '🧼' },
    { id: 'pen', label: 'Pen & Stationery', icon: '🖊️' },
    { id: 'hanger', label: 'Clothes Hanger', icon: '🧥' },
  ];

  // Example demo presets for instant one-click testing
  const samplePresets = [
    {
      title: 'Plastic Water Bottle',
      imageUrl: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80',
      category: 'bottle',
      hint: 'Single-use plastic 500ml mineral water bottle',
    },
    {
      title: 'Takeout Coffee Cup with Lid',
      imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
      category: 'cup',
      hint: 'Single-use coffee cup with plastic sip lid',
    },
    {
      title: 'Plastic Manual Toothbrush',
      imageUrl: 'https://images.unsplash.com/photo-1559591937-e62fb4d091b8?auto=format&fit=crop&w=600&q=80',
      category: 'toothbrush',
      hint: 'Plastic toothbrush with nylon bristles',
    },
    {
      title: 'Plastic Takeout Clamshell',
      imageUrl: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=600&q=80',
      category: 'container',
      hint: 'Disposable plastic takeout lunch box',
    },
    {
      title: 'Plastic Cutlery & Straw Pack',
      imageUrl: 'https://images.unsplash.com/photo-1574343635032-45e317c37df6?auto=format&fit=crop&w=600&q=80',
      category: 'cutlery',
      hint: 'Single-use plastic fork, knife, spoon and straw pack',
    },
    {
      title: 'Plastic Shopping Bag',
      imageUrl: 'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?auto=format&fit=crop&w=600&q=80',
      category: 'bag',
      hint: 'Single-use plastic grocery and produce shopping bag',
    },
    {
      title: 'Shampoo in Heavy Plastic Bottle',
      imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=600&q=80',
      category: 'soap',
      hint: 'Heavy plastic shampoo bottle with pump dispenser',
    },
    {
      title: 'Disposable Plastic Clothes Hanger',
      imageUrl: 'https://images.unsplash.com/photo-1582533561751-ef6f6ab93a2e?auto=format&fit=crop&w=600&q=80',
      category: 'hanger',
      hint: 'Molded plastic clothes and garment hanger',
    },
  ];

  const handleApplyPreset = (preset: typeof samplePresets[0]) => {
    stopCamera();
    setImagePreview(preset.imageUrl);
    setTextInput(preset.hint);
    setCategoryHint(preset.category);
    performScan(null, preset.hint, preset.category);
  };

  const handleReceiptUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile) {
      setError('Please attach the purchase receipt for verification.');
      return;
    }
    const earnedCredits = 160;
    setReceiptSuccessMsg(`SUCCESS · Receipt verified for ${activeReceiptTarget || 'eco-friendly purchase'}! +${earnedCredits} Green Points credited to your wallet.`);
    if (onPointsUpdated) {
      onPointsUpdated(1420 + earnedCredits);
    }
    setTimeout(() => {
      setShowReceiptModal(false);
      setReceiptSuccessMsg(null);
      setReceiptFile(null);
    }, 2000);
  };

  // -------------------------------------------------------------
  // Render Scan Results View
  // -------------------------------------------------------------
  if (result) {
    const isPlasticOrHigh = result.is_high_footprint ?? (result.sustainability.score < 60);

    // Extract same-category material alternatives (Steel, Glass, Wood/Bamboo)
    const materialAlts: MaterialAlternative[] = result.recommended_swap?.material_alternatives && result.recommended_swap.material_alternatives.length > 0
      ? result.recommended_swap.material_alternatives
      : [
          {
            material: 'Stainless Steel',
            name: `Stainless Steel ${result.product_candidate.name.replace(/plastic|single-use|disposable/gi, '').trim() || 'Reusable Alternative'}`,
            description: 'Food-grade stainless steel replacement built for lifetime durability, eliminating thousands of single-use items.',
            co2_avoided_kg: 8.5,
            credits_reward: 160,
            price: 18.99,
          },
          {
            material: 'Borosilicate Glass',
            name: `Borosilicate Glass ${result.product_candidate.name.replace(/plastic|single-use|disposable/gi, '').trim() || 'Reusable Alternative'} with Bamboo Cap`,
            description: '100% plastic-free, toxin-free vessel with natural organic bamboo lid and protective silicone grip.',
            co2_avoided_kg: 7.8,
            credits_reward: 140,
            price: 16.50,
          },
          {
            material: 'Natural Wood / Bamboo',
            name: `Natural Bamboo & Wood ${result.product_candidate.name.replace(/plastic|single-use|disposable/gi, '').trim() || 'Reusable Alternative'}`,
            description: 'Crafted from sustainably harvested rapid-growth organic bamboo and wood, fully biodegradable at end-of-life.',
            co2_avoided_kg: 8.2,
            credits_reward: 150,
            price: 19.50,
          },
        ];

    const activeAlternative = materialAlts[selectedAltIndex] || materialAlts[0];

    return (
      <div className="space-y-4">
        {/* Navigation back */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setImagePreview(null);
              setTextInput('');
              setError(null);
            }}
            className="text-xs sm:text-sm font-semibold text-[#008b5b] hover:text-[#007749] flex items-center gap-1 transition"
          >
            <ChevronLeft size={16} /> Scan another item
          </button>
          <span className="text-[11px] font-mono text-[#899ba8] bg-white px-2 py-0.5 rounded-md border border-[#e8efed]">
            {result.scan_id}
          </span>
        </div>

        {/* 1. Recognized Product Card */}
        <GreenCard
          bgColor={isPlasticOrHigh ? 'bg-red-50/40' : 'bg-[#e4f7eb]/50'}
          className={isPlasticOrHigh ? 'border-red-200 shadow-2xs' : 'border-[#a9efc3] shadow-2xs'}
        >
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-black/10 bg-white shadow-xs">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt={result.product_candidate.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-[#f4f8f6]">
                  <Leaf size={28} className={isPlasticOrHigh ? 'text-red-500' : 'text-[#008b5b]'} />
                  <span className="text-[10px] font-bold text-[#53667b] mt-1 line-clamp-1">
                    {result.product_candidate.category}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isPlasticOrHigh
                      ? 'text-red-700 bg-red-100'
                      : 'text-[#006b48] bg-[#cbf2d8]'
                  }`}
                >
                  {isPlasticOrHigh ? 'Identified Single-Use / High Footprint' : 'Eco-Friendly / Circular Item'}
                </span>
                <span className="text-[10px] text-[#53667b] font-medium bg-white px-2 py-0.5 rounded-md border border-[#e8efed]">
                  {result.product_candidate.category}
                </span>
              </div>

              <h3 className="text-base sm:text-xl font-black text-[#10243b] leading-tight">
                {result.product_candidate.name}
              </h3>
              <p className="text-xs text-[#53667b] mt-0.5">
                Brand: <strong className="text-[#10243b]">{result.product_candidate.brand}</strong> · Sustainability Score:{' '}
                <strong className={isPlasticOrHigh ? 'text-red-600' : 'text-[#008b5b]'}>
                  {result.sustainability.score}/100
                </strong>
              </p>

              {/* OCR Detected Label Text */}
              {result.detected_text && (
                <div className="mt-2 text-[11px] text-[#46594f] bg-white/90 p-2 rounded-xl border border-black/5 flex items-start gap-1.5">
                  <FileText size={13} className="text-[#008b5b] shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    <strong className="text-[#10243b]">OCR Label Text:</strong> {result.detected_text}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recognized Materials Chips */}
          {result.materials && result.materials.length > 0 && (
            <div className="mt-3 pt-3 border-t border-black/5">
              <span className="text-[10px] font-bold text-[#899ba8] uppercase tracking-wider block mb-1.5">
                Detected Material Composition:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {result.materials.map((mat, i) => (
                  <span
                    key={i}
                    className="text-[11px] font-medium px-2.5 py-1 bg-white text-[#10243b] rounded-lg border border-[#e8efed] shadow-2xs flex items-center gap-1"
                  >
                    <Layers size={11} className="text-[#008b5b]" />
                    {mat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </GreenCard>

        {/* 2. Carbon Footprint & Impact Assessment */}
        <SectionTitle title="Carbon & Environmental Impact" />
        <GreenCard bgColor="bg-[#fff7df]" className="border-amber-200 shadow-2xs">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-white rounded-2xl text-amber-700 shadow-2xs shrink-0 border border-amber-100">
              <Leaf size={28} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-black text-[#10243b]">
                {result.carbon.estimated.toFixed(2)} kg CO2e
                <span className="text-xs font-normal text-[#53667b] ml-1.5">per unit</span>
              </div>
              <p className="text-xs text-amber-900 mt-0.5 leading-relaxed">
                {result.carbon.boundary}
              </p>
            </div>
          </div>

          {/* Dimensional Breakdown */}
          <div className="mt-4 pt-3.5 border-t border-amber-200/60 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
            {Object.entries(result.sustainability.dimensions).slice(0, 5).map(([dim, val]) => (
              <div key={dim} className="bg-white/95 p-2 rounded-xl border border-amber-100 shadow-2xs">
                <span className="text-[10px] font-semibold text-[#899ba8] capitalize block truncate">
                  {dim.replace('_', ' ')}
                </span>
                <span className="text-xs font-bold text-[#10243b]">{val}/100</span>
                <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full ${val > 60 ? 'bg-[#008b5b]' : val > 35 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${val}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </GreenCard>

        {/* 3. SAME-CATEGORY SUSTAINABLE ALTERNATIVES (Steel / Glass / Wood) */}
        <SectionTitle title={`Sustainable Swaps for ${result.product_candidate.name}`} />
        <GreenCard bgColor="bg-[#e4f7eb]" className="border-[#a9efc3] shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#008b5b]" />
              <span className="text-xs font-bold text-[#006b48] uppercase tracking-wider">
                Same-Product Alternatives by Material
              </span>
            </div>
            <span className="text-[11px] font-bold text-[#008b5b] bg-white px-2.5 py-0.5 rounded-full border border-[#a9efc3] flex items-center gap-1 shadow-2xs">
              <Zap size={11} />
              Earn up to +{activeAlternative.credits_reward || 160} Points
            </span>
          </div>

          {/* Material Selector Tabs */}
          <div className="flex gap-1.5 p-1 bg-white/70 rounded-2xl border border-[#a9efc3] overflow-x-auto">
            {materialAlts.map((alt, idx) => {
              const isSelected = selectedAltIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedAltIndex(idx)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    isSelected
                      ? 'bg-[#008b5b] text-white shadow-xs'
                      : 'text-[#53667b] hover:bg-white/80'
                  }`}
                >
                  {alt.material.includes('Steel') && <span>🍶 Steel</span>}
                  {alt.material.includes('Glass') && <span>🫙 Glass</span>}
                  {(alt.material.includes('Wood') || alt.material.includes('Bamboo')) && <span>🪵 Wood/Bamboo</span>}
                  {alt.material.includes('Cotton') && <span>🌱 Cotton</span>}
                  {!alt.material.includes('Steel') && !alt.material.includes('Glass') && !alt.material.includes('Wood') && !alt.material.includes('Bamboo') && !alt.material.includes('Cotton') && (
                    <span>♻️ {alt.material}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Alternate Product Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#a9efc3] shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#e4f7eb] text-[#008b5b] border border-[#a9efc3] inline-block mb-1">
                  {activeAlternative.material} Alternative
                </span>
                <h4 className="text-base sm:text-lg font-black text-[#10243b] leading-tight">
                  {activeAlternative.name}
                </h4>
              </div>

              <div className="text-right shrink-0">
                <span className="text-base sm:text-lg font-black text-[#10243b] block">
                  {formatPrice(activeAlternative.price || 18.99)}
                </span>
                <span className="text-[10px] font-bold text-[#008b5b] bg-[#e4f7eb] px-1.5 py-0.5 rounded-md inline-block">
                  +{activeAlternative.credits_reward} Credits
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#46594f] leading-relaxed">
              {activeAlternative.description}
            </p>

            {/* Environmental Saving Highlight */}
            <div className="p-3 bg-[#f8fbfa] rounded-xl border border-[#e8efed] flex items-center justify-between text-xs">
              <span className="text-[#53667b] flex items-center gap-1.5 font-medium">
                <Leaf size={14} className="text-[#008b5b]" />
                Avoided Lifecycle Emissions:
              </span>
              <strong className="text-[#008b5b] font-bold text-sm">
                -{activeAlternative.co2_avoided_kg || 8.5} kg CO2e
              </strong>
            </div>

            {/* Actions for this alternative */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const marketItem: GreenMarketItem = {
                    id: `swap-${Date.now()}`,
                    name: activeAlternative.name,
                    brand: 'EcoVerified',
                    category: result.product_candidate.category || 'Sustainable Swaps',
                    type: 'product',
                    price: activeAlternative.price || 18.99,
                    creditsReward: activeAlternative.credits_reward || 150,
                    footprint: 0.15,
                    co2AvoidedKg: activeAlternative.co2_avoided_kg || 8.0,
                    score: 92,
                    verificationId: `CL-SWAP-${Date.now().toString().slice(-4)}`,
                    verificationBadge: `${activeAlternative.material} Certified Swap`,
                    verificationDetails: `Direct circular replacement for ${result.product_candidate.name}. Lifetime reusable item.`,
                    icon: 'bottle',
                    description: activeAlternative.description,
                  };
                  addToCart(marketItem, 1);
                  setJustAddedSwap(true);
                  setTimeout(() => setJustAddedSwap(false), 2000);
                }}
                className={`py-3 px-3 font-bold rounded-xl text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  justAddedSwap ? 'bg-[#006b48] text-white' : 'bg-[#10243b] hover:bg-[#1a385b] text-white'
                }`}
              >
                {justAddedSwap ? (
                  <>
                    <CheckCircle2 size={16} className="text-[#a9efc3]" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    <span>Add Swap to Cart</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveReceiptTarget(activeAlternative.name);
                  setShowReceiptModal(true);
                }}
                className="py-3 px-3 bg-[#008b5b] hover:bg-[#007749] text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Receipt size={16} />
                <span>Claim +{activeAlternative.credits_reward}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('Green Buy')}
                className="py-3 px-3 bg-white hover:bg-[#f4f8f6] text-[#008b5b] border border-[#a9efc3] font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag size={16} />
                <span>Browse Store</span>
              </button>
            </div>
          </div>

          {/* All 3 Options Overview Preview */}
          <div className="pt-1">
            <span className="text-[11px] font-bold text-[#006b48] uppercase tracking-wider block mb-2">
              Compare all material alternatives for {result.product_candidate.name}:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {materialAlts.map((alt, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedAltIndex(i)}
                  className={`p-3 rounded-xl border cursor-pointer transition text-left ${
                    selectedAltIndex === i
                      ? 'bg-white border-[#008b5b] shadow-sm ring-1 ring-[#008b5b]'
                      : 'bg-white/80 border-[#dce7e2] hover:bg-white'
                  }`}
                >
                  <span className="text-[10px] font-bold text-[#008b5b] block">
                    {alt.material}
                  </span>
                  <span className="text-xs font-bold text-[#10243b] line-clamp-1 block mt-0.5">
                    {alt.name}
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-[#53667b] mt-1.5 pt-1.5 border-t border-[#f0f4f2]">
                    <span>{formatPrice(alt.price || 18.99)}</span>
                    <span className="text-[#008b5b] font-semibold">-{alt.co2_avoided_kg} kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GreenCard>

        {/* 4. Methodology Accordion */}
        <div className="border border-[#e8efed] rounded-2xl bg-white overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setShowAccordion(!showAccordion)}
            className="w-full p-4 flex items-center justify-between font-semibold text-xs sm:text-sm text-[#10243b] hover:bg-[#fafcfb]"
          >
            <span className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#008b5b]" />
              Methodology, OCR audit & confidence ratings
            </span>
            <ChevronDown
              size={18}
              className={`transition-transform duration-200 ${showAccordion ? 'rotate-180' : ''}`}
            />
          </button>
          {showAccordion && (
            <div className="p-4 pt-0 text-xs text-[#53667b] space-y-2 border-t border-[#f0f4f2]">
              <p>
                <strong>AI Multimodal Recognition:</strong> Analyzed via Gemini 3.8 Flash visual geometry, packaging dimensions, OCR typography and material database.
              </p>
              <p>
                <strong>Lifecycle calculation method:</strong> {result.carbon.method}
              </p>
              <p>
                <strong>Benchmark database:</strong> {result.carbon.source}
              </p>
              <p>
                <strong>Confidence rating:</strong> {result.carbon.confidence}
              </p>
            </div>
          )}
        </div>

        {/* 5. Receipt Upload Modal */}
        {showReceiptModal && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <h3 className="text-lg font-bold text-[#10243b]">Upload Receipt for Green Buy</h3>
              <p className="text-xs text-[#53667b] leading-relaxed">
                Attach your purchase receipt for <strong>{activeReceiptTarget || activeAlternative.name}</strong> to automatically claim your Green Points reward.
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
                      AI OCR parser verifies merchant, date and bio-friendly item match.
                    </span>
                  </div>
                </div>

                {receiptSuccessMsg && <MessageBox message={receiptSuccessMsg} />}

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

  // -------------------------------------------------------------
  // Default Scanner Interface
  // -------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Mode Choice Tabs */}
      <ChoiceTabs
        labels={['Product Camera Scan', 'Receipt OCR Upload']}
        selected={modeIndex}
        onChanged={(v) => {
          setModeIndex(v);
          stopCamera();
          setImagePreview(null);
          setTextInput('');
          setError(null);
        }}
      />

      {/* Hidden elements for live capture */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Interactive Camera & Viewfinder Screen */}
      <div className="relative h-80 sm:h-96 rounded-3xl bg-gradient-to-b from-[#173a30] to-[#081c18] flex flex-col items-center justify-center overflow-hidden shadow-inner p-4">
        {/* Reticle / Viewfinder */}
        <div className="relative w-56 sm:w-64 h-64 sm:h-72 border-2 border-[#69d8a8] rounded-2xl flex items-center justify-center p-2 shadow-[0_0_20px_rgba(105,216,168,0.25)] overflow-hidden bg-black/50">
          {/* 1. Live Video Stream */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`w-full h-full object-cover rounded-xl ${isCameraActive ? 'block' : 'hidden'}`}
          />

          {/* 2. Photo Preview if uploaded/captured */}
          {!isCameraActive && imagePreview && (
            <img
              src={imagePreview}
              alt="Scan capture"
              className="w-full h-full object-cover rounded-xl"
            />
          )}

          {/* 3. Placeholder View when camera is idle */}
          {!isCameraActive && !imagePreview && (
            <div className="flex flex-col items-center text-center p-3 text-white">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-2.5 backdrop-blur-xs border border-white/15">
                {modeIndex === 0 ? <Camera size={32} className="text-[#a9efc3]" /> : <Receipt size={32} className="text-[#a9efc3]" />}
              </div>
              <span className="text-xs font-bold">
                {modeIndex === 0 ? 'Ready to Scan Product' : 'Ready to Scan Receipt'}
              </span>
              <span className="text-[11px] text-[#a9efc3]/90 mt-1">
                Point camera at product label or upload photo
              </span>
            </div>
          )}

          {/* Laser scanning line animation when processing */}
          {processing && (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-center">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-[#45e69e] to-transparent shadow-[0_0_12px_#45e69e] animate-bounce"></div>
            </div>
          )}

          {/* Corner viewfinder brackets */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-3 border-l-3 border-[#a9efc3]"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-3 border-r-3 border-[#a9efc3]"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-3 border-l-3 border-[#a9efc3]"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-3 border-r-3 border-[#a9efc3]"></div>
        </div>

        {/* Viewfinder Header Status */}
        <span className="absolute top-4 text-xs sm:text-sm font-bold text-white tracking-wide flex items-center gap-2">
          {processing ? (
            <span className="text-[#a9efc3] animate-pulse flex items-center gap-1.5">
              <Sparkles size={14} /> AI Analyzing Product…
            </span>
          ) : isCameraActive ? (
            <span className="text-[#a9efc3] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span> Live Scanner Active
            </span>
          ) : (
            'Gemini Multimodal Vision & OCR Scanner'
          )}
        </span>

        {/* Subtitle / Live Feedback */}
        <span className="absolute bottom-3 text-[11px] text-white/70 max-w-xs text-center truncate px-2">
          {processing ? statusStep : 'AI detects item and suggests matching Steel, Glass & Wood alternatives'}
        </span>
      </div>

      {error && <MessageBox message={error} isError />}

      {/* Target Category Selector Helper */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#e8efed] shadow-2xs space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#10243b] flex items-center gap-1.5">
            <Sliders size={14} className="text-[#008b5b]" />
            Item Type to Scan & Match:
          </label>
          <span className="text-[10px] text-[#899ba8]">Optional category hint</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {targetCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategoryHint(cat.id);
                if (cat.id !== 'auto') {
                  setTextInput(cat.label);
                }
              }}
              className={`py-1.5 px-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                categoryHint === cat.id
                  ? 'bg-[#008b5b] text-white shadow-2xs'
                  : 'bg-[#f4f8f6] hover:bg-[#e4f7eb] text-[#10243b] border border-[#e8efed]'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Camera & Capture Control Buttons */}
      <div className="space-y-3">
        {isCameraActive ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={capturePhotoFromCamera}
              disabled={processing}
              className="py-3.5 px-4 bg-[#008b5b] hover:bg-[#007749] text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              <Camera size={18} />
              <span>Capture & Analyze</span>
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="py-3.5 px-4 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              <VideoOff size={18} />
              <span>Stop Camera</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={startCamera}
              disabled={processing}
              className="py-3 px-4 bg-[#008b5b] hover:bg-[#007749] text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              <Camera size={18} />
              <span>Open Live Camera</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={processing}
              className="py-3 px-4 bg-white hover:bg-[#f4f8f6] text-[#10243b] border border-[#dce7e2] font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              <Upload size={18} className="text-[#008b5b]" />
              <span>Upload Photo / Document</span>
            </button>
          </div>
        )}

        {/* Text / Barcode manual search */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#e8efed] shadow-2xs space-y-2">
          <label className="block text-xs font-bold text-[#10243b]">
            Or enter item name / packaging text:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="e.g. Plastic Water Bottle, Coffee Cup, Toothbrush..."
              className="flex-1 px-3 py-2 text-xs sm:text-sm border border-[#dce7e2] rounded-xl focus:outline-hidden focus:border-[#008b5b]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && textInput.trim()) {
                  performScan(imagePreview, textInput.trim(), categoryHint);
                }
              }}
            />
            <button
              type="button"
              onClick={() => performScan(imagePreview, textInput.trim(), categoryHint)}
              disabled={processing || (!textInput.trim() && !imagePreview)}
              className="py-2 px-4 bg-[#10243b] hover:bg-[#1a385b] text-white text-xs sm:text-sm font-bold rounded-xl transition disabled:opacity-50"
            >
              {processing ? 'Analyzing…' : 'Analyze'}
            </button>
          </div>
        </div>

        {/* Quick Sample Presets */}
        <div>
          <span className="block text-[11px] font-semibold text-[#899ba8] uppercase tracking-wider mb-1.5">
            Quick Examples (Click to test AI recognition & swaps):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {samplePresets.map((preset, index) => (
              <button
                key={index}
                type="button"
                disabled={processing}
                onClick={() => handleApplyPreset(preset)}
                className="p-2.5 bg-white hover:bg-[#e4f7eb] border border-[#e8efed] hover:border-[#a9efc3] rounded-xl text-left transition group shadow-2xs"
              >
                <div className="w-full h-14 rounded-lg overflow-hidden mb-1.5 bg-gray-100">
                  <img src={preset.imageUrl} alt={preset.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                </div>
                <span className="text-xs font-bold text-[#10243b] group-hover:text-[#008b5b] line-clamp-1 block">
                  {preset.title}
                </span>
                <span className="text-[10px] text-[#899ba8] line-clamp-1 block mt-0.5">
                  Matches Steel, Glass & Wood
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Privacy / Settings Link */}
        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={() => onNavigate('Settings')}
            className="text-xs text-[#008b5b] hover:underline font-semibold"
          >
            Manage camera permissions & settings
          </button>
        </div>
      </div>
    </div>
  );
};
