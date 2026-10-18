import React, { useState } from 'react';
import { BrandMark, MessageBox } from '../../components/common/CommonWidgets';
import { Camera, MapPin, Activity, Mic, Lightbulb } from 'lucide-react';
import { ConsentPreferences } from '../../types';

interface ConsentScreenProps {
  initialConsent: ConsentPreferences;
  onConsentAccepted: (consent: ConsentPreferences) => void;
  onSignOut: () => void;
}

export const ConsentScreen: React.FC<ConsentScreenProps> = ({
  initialConsent,
  onConsentAccepted,
  onSignOut,
}) => {
  const [camera, setCamera] = useState(initialConsent.camera);
  const [location, setLocation] = useState(initialConsent.location);
  const [healthConnect, setHealthConnect] = useState(initialConsent.healthConnect);
  const [microphone, setMicrophone] = useState(initialConsent.microphone);
  const [personalization, setPersonalization] = useState(initialConsent.personalization);
  const [saving, setSaving] = useState(false);

  const handleContinue = () => {
    setSaving(true);
    setTimeout(() => {
      onConsentAccepted({
        camera,
        location,
        healthConnect,
        microphone,
        personalization,
        acceptedAt: new Date().toISOString(),
      });
    }, 200);
  };

  const options = [
    {
      id: 'camera',
      icon: <Camera size={20} className="text-[#008b5b]" />,
      title: 'Camera',
      desc: 'Scan products and receipts for footprint analysis',
      checked: camera,
      toggle: () => setCamera(!camera),
    },
    {
      id: 'location',
      icon: <MapPin size={20} className="text-[#008b5b]" />,
      title: 'Location',
      desc: 'Support commute and planting evidence verification',
      checked: location,
      toggle: () => setLocation(!location),
    },
    {
      id: 'health',
      icon: <Activity size={20} className="text-[#008b5b]" />,
      title: 'Physical activity',
      desc: 'Read only the Health Connect data a feature needs',
      checked: healthConnect,
      toggle: () => setHealthConnect(!healthConnect),
    },
    {
      id: 'mic',
      icon: <Mic size={20} className="text-[#008b5b]" />,
      title: 'Microphone',
      desc: 'Voice support is planned; no audio is captured in this build',
      checked: microphone,
      toggle: () => setMicrophone(!microphone),
    },
    {
      id: 'personalization',
      icon: <Lightbulb size={20} className="text-[#008b5b]" />,
      title: 'Personalized suggestions',
      desc: 'Use your green history for recommendations',
      checked: personalization,
      toggle: () => setPersonalization(!personalization),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e3f3e9] via-[#f8fbf9] to-[#eef4ef] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#e8efed] shadow-lg p-6 sm:p-8">
        <BrandMark compact />

        <div className="text-center my-6">
          <h2 className="text-2xl font-extrabold text-[#10243b]">Your data. Your choice.</h2>
          <p className="text-xs sm:text-sm text-[#53667b] mt-1.5">
            All preferences are optional. You can continue with every switch off.
          </p>
        </div>

        <MessageBox
          message="Demo preferences last for this session. Device permissions are requested separately when needed."
        />

        <div className="space-y-3 mb-6 divide-y divide-[#f0f4f2]">
          {options.map((opt) => (
            <div key={opt.id} className="pt-3 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 p-2 bg-[#e4f7eb] rounded-xl shrink-0">{opt.icon}</div>
                <div>
                  <h4 className="text-sm font-bold text-[#10243b]">{opt.title}</h4>
                  <p className="text-xs text-[#53667b]">{opt.desc}</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={opt.checked}
                  onChange={opt.toggle}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#008b5b]"></div>
              </label>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleContinue}
            disabled={saving}
            className="w-full py-3.5 px-4 bg-[#008b5b] hover:bg-[#007749] text-white font-bold rounded-xl transition shadow-sm"
          >
            {saving ? 'Saving preferences…' : 'Continue to my dashboard'}
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full py-2.5 text-xs sm:text-sm text-[#53667b] hover:text-[#10243b] font-medium"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};
