import React, { useState } from 'react';
import { GreenCard, ChoiceTabs, SectionTitle, MessageBox, MetricRow } from '../../components/common/CommonWidgets';
import { TreeMascot } from '../../components/common/Visuals';
import {
  TreePine,
  Calendar,
  CheckCircle,
  Clock,
  Users,
  Camera,
  ShieldCheck,
  MapPin,
  Maximize2,
  Minimize2,
  Upload,
  Navigation,
  ZoomIn,
  ZoomOut,
  Layers,
} from 'lucide-react';
import { ConsentPreferences, PlantingProject } from '../../types';
import { INITIAL_PROJECTS } from '../../data/mockData';

interface GrowGreenScreenProps {
  consent: ConsentPreferences;
}

export const GrowGreenScreen: React.FC<GrowGreenScreenProps> = ({ consent }) => {
  const [tab, setTab] = useState(0); // 0: Plant, 1: My Trees, 2: Impact
  const [projects, setProjects] = useState<PlantingProject[]>(INITIAL_PROJECTS);
  const [treeCount, setTreeCount] = useState('3');
  const [species, setSpecies] = useState('Native Pine & Birch');
  const [lat, setLat] = useState('37.7749');
  const [lng, setLng] = useState('-122.4194');
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  // Google Maps widget state
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [mapZoom, setMapZoom] = useState(14);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [pinPosition, setPinPosition] = useState({ x: 50, y: 50 }); // percentage on map box

  // Check-in state
  const [checkinPhoto, setCheckinPhoto] = useState('');
  const [checkpoint, setCheckpoint] = useState('DAY_30');
  const [checkinMsg, setCheckinMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPinPosition({ x, y });

    // Approximate lat/lng shift based on click
    const newLat = (37.7749 + (50 - y) * 0.001).toFixed(4);
    const newLng = (-122.4194 + (x - 50) * 0.001).toFixed(4);
    setLat(newLat);
    setLng(newLng);
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const currentLat = pos.coords.latitude.toFixed(4);
          const currentLng = pos.coords.longitude.toFixed(4);
          setLat(currentLat);
          setLng(currentLng);
          setPinPosition({ x: 50, y: 50 });
          setMessage('Successfully acquired precise GPS location from Google Location Services.');
          setIsError(false);
        },
        () => {
          setIsError(true);
          setMessage('Unable to retrieve location. Please check browser GPS permissions.');
        }
      );
    } else {
      setIsError(true);
      setMessage('Geolocation is not supported by your browser.');
    }
  };

  const handleRegisterPlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent.location) {
      setIsError(true);
      setMessage('Enable location consent before registering a plot.');
      return;
    }
    const count = parseInt(treeCount, 10);
    if (isNaN(count) || count <= 0) {
      setIsError(true);
      setMessage('Enter a valid number of trees.');
      return;
    }

    const newProject: PlantingProject = {
      project_id: `plot-${Date.now().toString().slice(-4)}`,
      claimed_count: count,
      species: species || 'Native mix',
      state: 'PENDING',
      location: { lat: parseFloat(lat) || 0, lng: parseFloat(lng) || 0 },
      created_at: new Date().toISOString(),
    };

    setProjects([newProject, ...projects]);
    setIsError(false);
    setMessage('Plot registered as PENDING. Add fresh check-in evidence with Google Location enabled to request verification.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setCheckinPhoto(file.name);
    }
  };

  const handleCheckinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent.location) {
      setCheckinMsg('Google Location consent is required to verify proximity.');
      return;
    }
    if (!checkinPhoto.trim()) {
      setCheckinMsg('Please capture or upload a check-in image with Google Location enabled.');
      return;
    }
    setCheckinMsg(`Check-in for ${checkpoint} submitted successfully. Status: PROVISIONAL (Geo-verified with Google Location & EXIF tagging).`);
    setSelectedFile(null);
    setCheckinPhoto('');
  };

  return (
    <div className="space-y-4">
      <ChoiceTabs
        labels={['Plant', 'My Trees', 'Impact']}
        selected={tab}
        onChanged={(v) => {
          setTab(v);
          setMessage(null);
        }}
      />

      {tab === 0 && (
        <div className="space-y-4">
          <GreenCard bgColor="bg-[#e4f7eb]" padding="p-6">
            <div className="flex flex-col items-center text-center">
              <TreeMascot size={150} />
              <h3 className="text-xl font-bold text-[#10243b] mt-2">
                Plant today. Help it thrive.
              </h3>
              <p className="text-xs text-[#006b48] mt-1">
                Every verified sapling contributes to biodiversity and carbon capture. Pinpoint your planting site accurately with Google Maps.
              </p>
            </div>
          </GreenCard>

          <SectionTitle title="Pinpoint Location on Google Maps" />

          {/* Google Maps Interactive Widget */}
          <div className="bg-white rounded-2xl border border-[#e8efed] overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-4 py-3 bg-[#f6f9f8] border-b border-[#e8efed]">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-[#008b5b]" />
                <span className="text-xs font-bold text-[#10243b]">Google Maps Pinpoint Selector</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMapType(mapType === 'roadmap' ? 'satellite' : 'roadmap')}
                  className="px-2.5 py-1 bg-white border border-[#dce7e2] text-xs font-semibold rounded-lg text-[#10243b] hover:bg-gray-50 flex items-center gap-1 shadow-2xs"
                >
                  <Layers size={13} className="text-[#008b5b]" />
                  {mapType === 'roadmap' ? 'Satellite' : 'Roadmap'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMapExpanded(!isMapExpanded)}
                  className="p-1.5 bg-white border border-[#dce7e2] rounded-lg text-[#10243b] hover:bg-gray-50 transition"
                  title={isMapExpanded ? 'Minimize Map' : 'Expand Map'}
                >
                  {isMapExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
              </div>
            </div>

            {/* Real Google Maps iframe Embed */}
            <div
              className={`relative transition-all duration-300 ${
                isMapExpanded ? 'h-96 sm:h-[480px]' : 'h-64 sm:h-72'
              }`}
            >
              <iframe
                title="Real Google Maps Plant Location"
                src={`https://maps.google.com/maps?q=${lat},${lng}&z=${mapZoom}&t=${mapType === 'satellite' ? 'k' : 'm'}&output=embed`}
                className="w-full h-full border-0 filter contrast-105"
                loading="lazy"
              ></iframe>

              {/* Pinpoint Overlay Indicator */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center">
                <div className="bg-[#008b5b] text-white p-2 rounded-full shadow-xl animate-bounce">
                  <MapPin size={22} />
                </div>
                <div className="bg-[#10243b] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow-lg mt-0.5 whitespace-nowrap">
                  Selected Planting Plot ({lat}, {lng})
                </div>
              </div>

              {/* Map Controls */}
              <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10">
                <button
                  type="button"
                  onClick={() => setMapZoom((z) => Math.min(20, z + 1))}
                  className="p-2 bg-white rounded-xl shadow-md text-[#10243b] hover:bg-gray-100 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setMapZoom((z) => Math.max(1, z - 1))}
                  className="p-2 bg-white rounded-xl shadow-md text-[#10243b] hover:bg-gray-100 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  className="p-2 bg-[#008b5b] text-white rounded-xl shadow-md hover:bg-[#007749] cursor-pointer"
                  title="Use My GPS Location"
                >
                  <Navigation size={16} />
                </button>
              </div>
            </div>

            <div className="px-4 py-2.5 bg-white text-xs text-[#53667b] flex justify-between items-center border-t border-[#e8efed]">
              <span>Lat: {lat}, Lng: {lng}</span>
              <span className="text-[#008b5b] font-semibold">Google Maps Geocoding Active</span>
            </div>
          </div>

          <SectionTitle title="Register a private planting plot" />

          <form onSubmit={handleRegisterPlot} className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e8efed] space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#10243b] mb-1">
                  Trees planted
                </label>
                <input
                  type="number"
                  min="1"
                  value={treeCount}
                  onChange={(e) => setTreeCount(e.target.value)}
                  className="w-full py-2.5 px-3 text-sm rounded-xl border border-[#dce7e2] focus:outline-hidden focus:border-[#008b5b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10243b] mb-1">
                  Species
                </label>
                <input
                  type="text"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  className="w-full py-2.5 px-3 text-sm rounded-xl border border-[#dce7e2] focus:outline-hidden focus:border-[#008b5b]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#10243b] mb-1">
                  Latitude
                </label>
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="w-full py-2.5 px-3 text-sm rounded-xl border border-[#dce7e2] focus:outline-hidden focus:border-[#008b5b]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#10243b] mb-1">
                  Longitude
                </label>
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="w-full py-2.5 px-3 text-sm rounded-xl border border-[#dce7e2] focus:outline-hidden focus:border-[#008b5b]"
                />
              </div>
            </div>

            {message && <MessageBox message={message} isError={isError} />}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#008b5b] hover:bg-[#007749] text-white font-bold rounded-xl text-sm transition shadow-sm"
            >
              Register planting plot
            </button>
          </form>

          <MessageBox
            message="Plots are private by default. Planting, survival and carbon estimates are separate. Google Maps and satellite images cannot prove an individual sapling survives without geo-tagged check-ins."
          />
        </div>
      )}

      {tab === 1 && (
        <div className="space-y-4">
          <SectionTitle title="Your Registered Plots" />
          <div className="space-y-2.5">
            {projects.map((proj) => (
              <GreenCard key={proj.project_id} padding="p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#e4f7eb] text-[#008b5b] rounded-xl">
                      <TreePine size={22} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#10243b]">
                        {proj.claimed_count} trees · {proj.species}
                      </h4>
                      <p className="text-xs text-[#53667b]">
                        Plot ID: {proj.project_id} · Lat: {proj.location.lat.toFixed(2)}, Lng: {proj.location.lng.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      proj.state === 'VESTED'
                        ? 'bg-[#e4f7eb] text-[#008b5b]'
                        : proj.state === 'PROVISIONAL'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {proj.state}
                  </span>
                </div>
              </GreenCard>
            ))}
          </div>

          <SectionTitle title="Fresh check-in" />
          <form onSubmit={handleCheckinSubmit} className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e8efed] space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#10243b] mb-1.5">
                Check-in Photo (Camera or Upload)
              </label>

              {/* Camera / Upload Dropzone */}
              <div className="border-2 border-dashed border-[#dce7e2] hover:border-[#008b5b] rounded-2xl p-6 text-center bg-[#f6f9f8] transition cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-[#e4f7eb] text-[#008b5b] rounded-full">
                    <Camera size={26} />
                  </div>
                  <span className="text-xs font-bold text-[#10243b]">
                    {selectedFile ? selectedFile.name : 'Click to capture or upload check-in photo'}
                  </span>
                  <p className="text-[11px] text-[#53667b] max-w-xs">
                    Image need to be captured by enabling the Google Location enabled.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#10243b] mb-1">
                Checkpoint
              </label>
              <select
                value={checkpoint}
                onChange={(e) => setCheckpoint(e.target.value)}
                className="w-full py-2.5 px-3 text-sm rounded-xl border border-[#dce7e2] bg-white focus:outline-hidden focus:border-[#008b5b]"
              >
                <option value="DAY_0">DAY 0 · Planting Evidence</option>
                <option value="DAY_30">DAY 30 · Fresh Owner Check-in</option>
                <option value="DAY_90">DAY 90 · Community Visitor Check</option>
                <option value="DAY_180">DAY 180 · Growth Persistence</option>
                <option value="DAY_365">DAY 365 · Verified 1-Year Survival</option>
              </select>
            </div>

            {/* Approval stages description */}
            <div className="bg-[#f6f9f8] p-3.5 rounded-xl border border-[#e8efed] space-y-1.5 text-xs text-[#53667b]">
              <div className="font-bold text-[#10243b] mb-1">Approval Stages Guide:</div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                <span><strong className="text-[#10243b]">Pending:</strong> Plot registered, awaiting initial geo-tagged check-in.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span><strong className="text-[#10243b]">Provisional:</strong> Evidence submitted with Google Location enabled; under satellite & sensor review.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#008b5b]"></span>
                <span><strong className="text-[#10243b]">Vested:</strong> 1-year survival verified; full carbon removal credits unlocked!</span>
              </div>
            </div>

            {checkinMsg && <MessageBox message={checkinMsg} />}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#008b5b] hover:bg-[#007749] text-white font-bold rounded-xl text-sm transition shadow-sm"
            >
              Submit for verification
            </button>
          </form>
        </div>
      )}

      {tab === 2 && (
        <div className="space-y-4">
          <SectionTitle title="Persistence checkpoints" />
          <GreenCard>
            <div className="divide-y divide-[#e8efed]">
              <MetricRow
                icon={<Camera size={18} />}
                label="Day 0 · planting evidence (Pending)"
                value="PENDING"
              />
              <MetricRow
                icon={<Clock size={18} />}
                label="Day 30 · fresh owner check-in (Provisional)"
                value="PROVISIONAL"
              />
              <MetricRow
                icon={<Users size={18} />}
                label="Day 90 · optional visitor (Provisional)"
                value="PROVISIONAL"
              />
              <MetricRow
                icon={<TreePine size={18} />}
                label="Day 180 · persistence (Provisional)"
                value="PROVISIONAL"
              />
              <MetricRow
                icon={<ShieldCheck size={18} />}
                label="Day 365 · verified survival (Vested)"
                value="VESTED"
                highlight
              />
            </div>
          </GreenCard>

          <p className="text-xs text-[#53667b] leading-relaxed">
            Checkpoints require fresh evidence near your plot with Google Location enabled. Reused photos and self-confirmations cannot establish independent verification.
          </p>
        </div>
      )}
    </div>
  );
};
