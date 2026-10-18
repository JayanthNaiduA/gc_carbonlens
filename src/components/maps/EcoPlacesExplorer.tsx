import React, { useState } from 'react';
import { MapPin, Search, ExternalLink, Navigation, Sparkles, Loader2 } from 'lucide-react';
import { GreenCard } from '../common/CommonWidgets';

interface EcoPlacesExplorerProps {
  initialQuery?: string;
  categoryTitle?: string;
  defaultLocationName?: string;
}

interface GroundingChunk {
  maps?: {
    uri?: string;
    title?: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        snippet?: string;
      }[];
    };
  };
  web?: {
    uri?: string;
    title?: string;
  };
}

export const EcoPlacesExplorer: React.FC<EcoPlacesExplorerProps> = ({
  initialQuery = 'Verified e-waste recycling drop-off centers and battery collection bins near San Francisco',
  categoryTitle = 'Find Eco Locations with Google Maps',
  defaultLocationName = 'San Francisco, CA',
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResultText(null);
    setGroundingChunks([]);

    try {
      // Get browser geolocation if available
      let lat = 37.7749;
      let lng = -122.4194;

      if (navigator.geolocation) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
          });
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (_) {
          // fallback to default coordinates
        }
      }

      const response = await fetch('/api/gemini/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          latitude: lat,
          longitude: lng,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to search Google Maps data');
      }

      setResultText(data.text);
      setGroundingChunks(data.groundingChunks || []);
    } catch (err: any) {
      console.error('Maps Grounding Error:', err);
      setError(err.message || 'Could not fetch live Google Maps data');
    } finally {
      setLoading(false);
    }
  };

  // Filter out chunks that have maps or web URIs
  const mapLinks = groundingChunks
    .map((chunk) => {
      if (chunk.maps?.uri) {
        return {
          title: chunk.maps.title || 'View Location on Google Maps',
          uri: chunk.maps.uri,
          isMap: true,
          snippet: chunk.maps.placeAnswerSources?.reviewSnippets?.[0]?.snippet,
        };
      }
      if (chunk.web?.uri) {
        return {
          title: chunk.web.title || 'Official Website',
          uri: chunk.web.uri,
          isMap: false,
          snippet: undefined,
        };
      }
      return null;
    })
    .filter(Boolean) as { title: string; uri: string; isMap: boolean; snippet?: string }[];

  return (
    <div className="space-y-3.5 bg-white p-4 sm:p-5 rounded-2xl border border-[#e8efed] shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#e4f7eb] text-[#008b5b] rounded-lg">
            <MapPin size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#10243b]">{categoryTitle}</h4>
            <p className="text-[11px] text-[#53667b]">Grounded with live Google Maps data</p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-[#008b5b] bg-[#e4f7eb] px-2 py-0.5 rounded-full flex items-center gap-1">
          <Sparkles size={11} />
          gemini-3.8-flash
        </span>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-3 text-[#899ba8]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search eco locations, drop-offs, parks..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-[#dce7e2] focus:outline-hidden focus:border-[#008b5b]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="py-2 px-3.5 bg-[#008b5b] hover:bg-[#007749] text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs shrink-0"
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Navigation size={15} />}
          <span>{loading ? 'Searching…' : 'Locate'}</span>
        </button>
      </form>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {error}
        </div>
      )}

      {/* Answer Output */}
      {resultText && (
        <div className="p-3.5 bg-[#f8fbfa] border border-[#e8efed] rounded-xl text-xs sm:text-sm text-[#10243b] leading-relaxed whitespace-pre-line">
          {resultText}
        </div>
      )}

      {/* Grounded Google Maps Links (MANDATORY REQUIREMENT) */}
      {mapLinks.length > 0 && (
        <div className="space-y-2 pt-1">
          <h5 className="text-xs font-bold text-[#53667b] uppercase tracking-wider flex items-center gap-1">
            <MapPin size={12} className="text-[#008b5b]" />
            Verified Google Maps Places & Navigation
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {mapLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-white hover:bg-[#e4f7eb]/50 border border-[#dce7e2] hover:border-[#008b5b] rounded-xl text-xs text-[#10243b] flex flex-col justify-between transition group shadow-2xs"
              >
                <div className="flex items-center justify-between gap-1.5 font-bold text-[#008b5b] group-hover:underline">
                  <span className="truncate">{link.title}</span>
                  <ExternalLink size={13} className="shrink-0" />
                </div>
                {link.snippet && (
                  <p className="text-[11px] text-[#53667b] mt-1 line-clamp-2">
                    "{link.snippet}"
                  </p>
                )}
                <span className="text-[10px] text-[#899ba8] mt-1.5 block">
                  Open in Google Maps ↗
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
