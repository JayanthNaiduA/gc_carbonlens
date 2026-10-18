import React, { useState } from 'react';
import { GreenCard, SectionTitle, MetricRow, MessageBox } from '../../components/common/CommonWidgets';
import {
  User as UserIcon,
  Camera,
  Footprints,
  MapPin,
  Mic,
  Lightbulb,
  Shield,
  LogOut,
  Sliders,
  CheckCircle,
  Award,
  Sun,
  Moon,
  Upload,
  Calendar,
  Edit3,
  Check,
} from 'lucide-react';
import { User, ConsentPreferences } from '../../types';

interface SettingsScreenProps {
  user: User;
  consent: ConsentPreferences;
  onUpdateConsent: (updated: ConsentPreferences) => void;
  onSignOut: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  user,
  consent,
  onUpdateConsent,
  onSignOut,
}) => {
  // Bio state
  const [age, setAge] = useState('28');
  const [gender, setGender] = useState('Non-binary / Prefer not to say');
  const [bioText, setBioText] = useState('Passionate about climate action, circular economies, and regenerative forestry.');
  const [joinedDate] = useState('October 2026');
  const [isEditingBio, setIsEditingBio] = useState(false);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Profile Picture state
  const [profilePic, setProfilePic] = useState<string | null>(null);

  // Consent modal state
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [camera, setCamera] = useState(consent.camera);
  const [location, setLocation] = useState(consent.location);
  const [healthConnect, setHealthConnect] = useState(consent.healthConnect);
  const [microphone, setMicrophone] = useState(consent.microphone);
  const [personalization, setPersonalization] = useState(consent.personalization);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSaveConsent = () => {
    const updated: ConsentPreferences = {
      camera,
      location,
      healthConnect,
      microphone,
      personalization,
      acceptedAt: new Date().toISOString(),
    };
    onUpdateConsent(updated);
    setShowConsentModal(false);
    setNotice('Privacy preferences updated successfully.');
    setTimeout(() => setNotice(null), 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setProfilePic(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const achievements = [
    { id: 'ach-1', title: 'Carbon Pioneer', desc: 'Saved over 100kg of CO2e', icon: '🌿' },
    { id: 'ach-2', title: 'Zero Plastic Hero', desc: 'Recycled 5+ e-waste items', icon: '♻️' },
    { id: 'ach-3', title: 'Master Planter', desc: 'Vested 3+ native trees', icon: '🌳' },
    { id: 'ach-4', title: 'Green Commuter', desc: '50km walked or cycled', icon: '🚲' },
  ];

  return (
    <div className="space-y-4">
      {/* User Profile & Bio Card */}
      <GreenCard padding="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-[#e4f7eb] text-[#008b5b] flex items-center justify-center font-bold text-2xl overflow-hidden border-2 border-[#008b5b]/30 shadow-md">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={36} />
              )}
            </div>
            <label className="absolute bottom-0 right-0 p-1.5 bg-[#008b5b] text-white rounded-full shadow-md cursor-pointer hover:bg-[#007749] transition">
              <Camera size={13} />
              <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2">
              <h3 className="text-lg font-black text-[#10243b]">
                {user.displayName}
              </h3>
              <div className="flex items-center gap-2">
                {/* Small Compact Sign Out Button */}
                <button
                  type="button"
                  onClick={onSignOut}
                  className="py-1 px-3 bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="Sign out of CarbonLens"
                >
                  <LogOut size={13} />
                  <span>Sign out</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-[#53667b]">
              {user.isDemo ? 'Local demo account' : user.email || user.phoneNumber}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-[#53667b]">
              <span className="bg-[#f4f8f6] px-2.5 py-1 rounded-lg border border-[#e8efed] font-medium">
                Age: <strong className="text-[#10243b]">{age}</strong>
              </span>
              <span className="bg-[#f4f8f6] px-2.5 py-1 rounded-lg border border-[#e8efed] font-medium">
                Gender: <strong className="text-[#10243b]">{gender}</strong>
              </span>
              <span className="bg-[#f4f8f6] px-2.5 py-1 rounded-lg border border-[#e8efed] font-medium flex items-center gap-1">
                <Calendar size={12} className="text-[#008b5b]" />
                Joined: <strong className="text-[#10243b]">{joinedDate}</strong>
              </span>
            </div>

            {isEditingBio ? (
              <div className="mt-3 space-y-2 pt-2 border-t border-[#e8efed]">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Age"
                    className="py-1.5 px-3 text-xs rounded-xl border border-[#dce7e2]"
                  />
                  <input
                    type="text"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    placeholder="Gender"
                    className="py-1.5 px-3 text-xs rounded-xl border border-[#dce7e2]"
                  />
                </div>
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  placeholder="Bio info..."
                  className="w-full py-1.5 px-3 text-xs rounded-xl border border-[#dce7e2]"
                  rows={2}
                />
                <button
                  type="button"
                  onClick={() => setIsEditingBio(false)}
                  className="py-1.5 px-3 bg-[#008b5b] text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Check size={13} /> Save Bio
                </button>
              </div>
            ) : (
              <div className="mt-2 text-xs text-[#404c5e] italic flex items-center justify-between">
                <span>"{bioText}"</span>
                <button
                  type="button"
                  onClick={() => setIsEditingBio(true)}
                  className="text-[#008b5b] font-bold text-[11px] flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Edit3 size={12} /> Edit Bio
                </button>
              </div>
            )}
          </div>
        </div>
      </GreenCard>

      {/* App Appearance: Bright / Dark Theme Toggle */}
      <GreenCard padding="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${isDarkMode ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
              {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#10243b]">App Theme Appearance</h4>
              <p className="text-xs text-[#53667b]">
                {isDarkMode ? 'Dark Mode active (Night theme)' : 'Bright Mode active (Standard theme)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`py-2 px-4 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
              isDarkMode
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            <span>{isDarkMode ? 'Switch to Bright' : 'Switch to Dark'}</span>
          </button>
        </div>
      </GreenCard>

      {/* Achievements & Badges Showcase */}
      <div className="space-y-3">
        <SectionTitle title="Achievements & Climate Badges" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className="bg-white rounded-2xl border border-[#e8efed] p-3 text-center flex flex-col items-center justify-center shadow-xs hover:border-[#008b5b]/50 transition"
            >
              <span className="text-2xl mb-1">{ach.icon}</span>
              <h5 className="text-xs font-bold text-[#10243b]">{ach.title}</h5>
              <p className="text-[10px] text-[#53667b] mt-0.5">{ach.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <SectionTitle title="Privacy & Data Consent" />

      {notice && <MessageBox message={notice} />}

      {/* Preferences Display Card */}
      <GreenCard>
        <div className="divide-y divide-[#e8efed]">
          <MetricRow
            icon={<Camera size={18} />}
            label="Camera"
            value={consent.camera ? 'Allowed' : 'Off'}
            highlight={consent.camera}
          />
          <MetricRow
            icon={<Footprints size={18} />}
            label="Physical activity"
            value={consent.healthConnect ? 'Allowed' : 'Off'}
            highlight={consent.healthConnect}
          />
          <MetricRow
            icon={<MapPin size={18} />}
            label="Location"
            value={consent.location ? 'Allowed' : 'Off'}
            highlight={consent.location}
          />
          <MetricRow
            icon={<Mic size={18} />}
            label="Microphone"
            value={consent.microphone ? 'Allowed' : 'Off'}
            highlight={consent.microphone}
          />
          <MetricRow
            icon={<Lightbulb size={18} />}
            label="Personalized suggestions"
            value={consent.personalization ? 'Allowed' : 'Off'}
            highlight={consent.personalization}
          />
        </div>
      </GreenCard>

      <button
        type="button"
        onClick={() => {
          setCamera(consent.camera);
          setLocation(consent.location);
          setHealthConnect(consent.healthConnect);
          setMicrophone(consent.microphone);
          setPersonalization(consent.personalization);
          setShowConsentModal(true);
        }}
        className="w-full py-3 px-4 bg-white border border-[#dce7e2] hover:bg-[#f4f8f6] text-[#10243b] font-bold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer"
      >
        <Sliders size={16} className="text-[#008b5b]" />
        Review privacy preferences
      </button>

      <p className="text-[11px] text-[#53667b] leading-tight pt-1">
        Green Points are loyalty units. Device permissions are requested separately and can be changed in device settings.
      </p>

      {/* Review Preferences Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#10243b]">Update Privacy Choices</h3>
            <p className="text-xs text-[#53667b]">
              Adjust permissions for features as you see fit.
            </p>

            <div className="space-y-3 divide-y divide-[#f0f4f2]">
              {[
                { label: 'Camera', checked: camera, toggle: () => setCamera(!camera) },
                { label: 'Location', checked: location, toggle: () => setLocation(!location) },
                { label: 'Physical activity', checked: healthConnect, toggle: () => setHealthConnect(!healthConnect) },
                { label: 'Microphone', checked: microphone, toggle: () => setMicrophone(!microphone) },
                { label: 'Personalized suggestions', checked: personalization, toggle: () => setPersonalization(!personalization) },
              ].map((item) => (
                <div key={item.label} className="pt-2.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#10243b]">{item.label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={item.toggle}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#008b5b]"></div>
                  </label>
                </div>
              ))}
            </div>

            <div className="flex gap-2.5 pt-3">
              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#10243b] font-semibold text-xs sm:text-sm rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveConsent}
                className="flex-1 py-2.5 bg-[#008b5b] hover:bg-[#007749] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs"
              >
                Save choices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
