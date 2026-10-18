import React, { useState, useEffect } from 'react';
import { Video, Sparkles, Loader2, Play, Download, RefreshCw, Film } from 'lucide-react';
import { GreenCard, ChoiceTabs, MessageBox } from '../../components/common/CommonWidgets';

export const EcoVideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState(
    'Timelapse of a tiny oak sapling sprouting through soil, unfurling vibrant green leaves into a majestic ancient tree with golden sun rays, cinematic 4k'
  );
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    {
      title: 'Sapling Growth Timelapse',
      prompt:
        'Timelapse of a tiny oak sapling sprouting through soil, unfurling vibrant green leaves into a majestic ancient tree with golden sun rays, cinematic 4k',
    },
    {
      title: 'Green Micro-Mobility Future',
      prompt:
        'Clean futuristic city street with blooming green rooftops, electric bicycles gliding on sunlit bike lanes, and peaceful clean air, 4k hyperrealistic',
    },
    {
      title: 'E-Waste to Forest Metaphor',
      prompt:
        'A recycled electronics circuit board glowing with light as it transforms into a lush green forest leaf, metaphor for zero-waste e-cycling, stunning cinematic visual',
    },
    {
      title: 'Community Tree Planting',
      prompt:
        'Urban community volunteers planting native saplings in a community garden, rich soil, warm sunlight, joyful atmosphere, high quality cinematography',
    },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setStatusMessage('Submitting request to Veo 3 (veo-3.1-fast-generate-preview)…');

    try {
      // Step 1: Start video generation
      const startRes = await fetch('/api/gemini/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
        }),
      });

      const startData = await startRes.json();
      if (!startRes.ok) {
        throw new Error(startData.error || 'Failed to start video generation');
      }

      const operationName = startData.operationName;
      setStatusMessage('Veo 3 is generating your video. Synthesizing motion and temporal coherence…');

      // Step 2: Poll operation status every 5 seconds
      let isDone = false;
      let attempts = 0;
      const maxAttempts = 40; // up to 200 seconds

      while (!isDone && attempts < maxAttempts) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 5000));

        if (attempts === 2) {
          setStatusMessage('Rendering cinematic lighting and eco textures…');
        } else if (attempts === 5) {
          setStatusMessage('Synthesizing frames and stabilizing scene transitions…');
        } else if (attempts === 8) {
          setStatusMessage('Almost ready! Finalizing video encoding…');
        }

        const pollRes = await fetch('/api/gemini/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName }),
        });

        const pollData = await pollRes.json();
        if (pollData.error) {
          throw new Error(pollData.error.message || 'Error occurred during video generation');
        }

        if (pollData.done) {
          isDone = true;
          break;
        }
      }

      if (!isDone) {
        throw new Error('Video generation timed out. Please retry with a shorter prompt.');
      }

      // Step 3: Download video
      setStatusMessage('Video generated! Downloading video stream…');
      const downloadRes = await fetch('/api/gemini/video-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName }),
      });

      if (!downloadRes.ok) {
        throw new Error('Failed to download generated video');
      }

      const blob = await downloadRes.blob();
      const objectUrl = URL.createObjectURL(blob);
      setVideoUrl(objectUrl);
      setStatusMessage('');
    } catch (err: any) {
      console.error('Veo video generation error:', err);
      setError(err.message || 'Failed to generate video with Veo 3.');
      setStatusMessage('');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hero Banner */}
      <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-r from-[#008b5b] to-[#173a30] text-white shadow-md">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-white/20 rounded-xl">
            <Video size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight">
              Veo 3 Eco Video Generator
            </h3>
            <span className="text-xs text-white/80 font-medium">
              Powered by <span className="font-mono text-[#a9efc3]">veo-3.1-fast-generate-preview</span>
            </span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-white/90 leading-relaxed mt-1">
          Turn your sustainability actions, planting plots, and greener journey into cinematic video stories.
        </p>
      </div>

      {/* Generator Form */}
      <form onSubmit={handleGenerate} className="bg-white p-4 sm:p-5 rounded-2xl border border-[#e8efed] space-y-3.5 shadow-xs">
        <div>
          <label className="block text-xs font-bold text-[#10243b] mb-1.5">
            Video Prompt Description
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            rows={3}
            className="w-full p-3 text-xs sm:text-sm rounded-xl border border-[#dce7e2] focus:outline-hidden focus:border-[#008b5b] leading-relaxed resize-none"
            placeholder="Describe the eco video scene you want to generate..."
          />
        </div>

        {/* Aspect Ratio Picker */}
        <div>
          <label className="block text-xs font-bold text-[#10243b] mb-1.5">
            Aspect Ratio (Required: 16:9 Landscape or 9:16 Portrait)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setAspectRatio('16:9')}
              className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
                aspectRatio === '16:9'
                  ? 'bg-[#e4f7eb] border-[#008b5b] text-[#008b5b]'
                  : 'bg-white border-[#dce7e2] text-[#53667b] hover:bg-[#f4f8f6]'
              }`}
            >
              <div className="w-5 h-3.5 border-2 border-current rounded-xs"></div>
              16:9 Landscape
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setAspectRatio('9:16')}
              className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
                aspectRatio === '9:16'
                  ? 'bg-[#e4f7eb] border-[#008b5b] text-[#008b5b]'
                  : 'bg-white border-[#dce7e2] text-[#53667b] hover:bg-[#f4f8f6]'
              }`}
            >
              <div className="w-3.5 h-5 border-2 border-current rounded-xs"></div>
              9:16 Story Portrait
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="block text-[11px] font-semibold text-[#899ba8] uppercase tracking-wider mb-1.5">
            Quick Eco Prompt Presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => (
              <button
                key={preset.title}
                type="button"
                disabled={isGenerating}
                onClick={() => setPrompt(preset.prompt)}
                className="py-1 px-2.5 bg-[#f8fbfa] hover:bg-[#e4f7eb] text-[#10243b] hover:text-[#008b5b] text-xs rounded-lg border border-[#e8efed] transition font-medium"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {error && <MessageBox message={error} isError />}

        <button
          type="submit"
          disabled={isGenerating}
          className="w-full py-3.5 px-4 bg-[#008b5b] hover:bg-[#007749] text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating Video with Veo 3…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate Video ({aspectRatio})
            </>
          )}
        </button>

        {isGenerating && (
          <div className="p-4 bg-[#e4f7eb]/70 rounded-xl border border-[#a9efc3] text-center space-y-2">
            <Loader2 size={24} className="animate-spin text-[#008b5b] mx-auto" />
            <p className="text-xs sm:text-sm font-bold text-[#006b48]">{statusMessage}</p>
            <p className="text-[11px] text-[#46594f]">
              Video generation may take 1-2 minutes. Please keep this screen open while Veo synthesizes your video.
            </p>
          </div>
        )}
      </form>

      {/* Generated Video Player */}
      {videoUrl && (
        <GreenCard padding="p-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#10243b] flex items-center gap-2">
                <Film size={18} className="text-[#008b5b]" />
                Generated Veo 3 Video ({aspectRatio})
              </h4>
              <a
                href={videoUrl}
                download={`carbonlens-veo3-${Date.now()}.mp4`}
                className="py-1 px-2.5 bg-[#008b5b] hover:bg-[#007749] text-white text-xs font-bold rounded-lg transition flex items-center gap-1 shadow-2xs"
              >
                <Download size={13} />
                Download MP4
              </a>
            </div>

            <div
              className={`mx-auto bg-black rounded-2xl overflow-hidden shadow-md flex items-center justify-center ${
                aspectRatio === '9:16' ? 'max-w-xs aspect-[9/16]' : 'w-full aspect-[16/9]'
              }`}
            >
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </GreenCard>
      )}
    </div>
  );
};
