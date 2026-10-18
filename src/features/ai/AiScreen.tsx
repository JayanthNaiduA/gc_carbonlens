import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Mic,
  MicOff,
  Sparkles,
  Loader2,
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  Volume2,
} from 'lucide-react';
import { GreenCard, MessageBox } from '../../components/common/CommonWidgets';
import { TreeMascot } from '../../components/common/Visuals';
import { ConsentPreferences } from '../../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

interface AiScreenProps {
  consent: ConsentPreferences;
  userName?: string;
  initialScanId?: string;
}

export const AiScreen: React.FC<AiScreenProps> = ({
  consent,
  userName = 'John',
  initialScanId = 'scan-bamboo-toothbrush-8821',
}) => {
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Hello ${userName}! I'm CarbonLens AI, your personal climate analyst and sustainability guide. I can help evaluate your daily carbon footprints, find circular alternatives, or verify eco actions. How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.8-flash',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon'>('gemini-3.8-flash');
  const [selectedRole, setSelectedRole] = useState<'advisor' | 'zero_waste' | 'commute'>('advisor');
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const systemInstructions: Record<string, string> = {
    advisor:
      'You are CarbonLens AI, an expert Senior Sustainability Advisor and Climate Intelligence Analyst. You help users measure, reduce, and verify personal carbon emissions across products, transportation, tree planting, and recycling. Provide clear, empathetic, scientifically grounded advice.',
    zero_waste:
      'You are the CarbonLens Zero-Waste Guide. You specialize in plastics elimination, circular packaging, composting, repairability, and minimal-waste everyday living. Give practical, high-impact domestic tips.',
    commute:
      'You are the CarbonLens Micro-Mobility & Clean Commute Specialist. You help users replace car trips with cycling, walking, and electric transit, calculating avoided emissions and route efficiency.',
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Audio recording handlers using gemini-3.5-transcribe
  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      setError('Could not access microphone. Please allow microphone permissions in your browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];

        const response = await fetch('/api/gemini/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Data,
            mimeType: 'audio/webm',
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to transcribe audio');
        }

        if (data.transcription) {
          setInput((prev) => (prev ? `${prev} ${data.transcription}` : data.transcription));
        }
      };
    } catch (err: any) {
      console.error('Transcription error:', err);
      setError(err.message || 'Audio transcription with gemini-3.5-transcribe failed.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // Send Chat message (multi-turn conversation)
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || input;
    if (!textToSend.trim() || isSending) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsSending(true);
    setError(null);

    try {
      const historyPayload = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          model: selectedModel,
          systemInstruction: systemInstructions[selectedRole],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get response from Gemini');
      }

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.modelUsed,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Chat request failed. Please retry.');
    } finally {
      setIsSending(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Chat history cleared. I'm ready to answer questions using ${selectedModel}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: selectedModel,
      },
    ]);
  };

  return (
    <div className="space-y-4 flex flex-col h-[82vh]">
      {/* Top Header / Model & Role Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#e8efed] shadow-xs shrink-0 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#e4f7eb] text-[#008b5b] rounded-xl shrink-0">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#10243b]">CarbonLens Gemini Assistant</h3>
            <span className="text-[11px] text-[#008b5b] font-medium flex items-center gap-1">
              Active: <span className="font-mono">{selectedModel}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-[#53667b] hover:text-[#008b5b] hover:bg-[#e4f7eb] rounded-xl transition"
            title="Chatbot model & role configuration"
          >
            <SlidersHorizontal size={17} />
          </button>
          <button
            type="button"
            onClick={handleClearHistory}
            className="p-2 text-[#53667b] hover:text-red-600 hover:bg-red-50 rounded-xl transition"
            title="Clear chat history"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>

      {/* Expandable Model & Role Settings Drawer */}
      {showSettings && (
        <div className="p-4 bg-white rounded-2xl border border-[#e8efed] shadow-xs space-y-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#10243b] mb-1">
                Gemini Model Selection
              </label>
              <select
                value={selectedModel}
                onChange={(e: any) => setSelectedModel(e.target.value)}
                className="w-full py-2 px-3 text-xs sm:text-sm rounded-xl border border-[#dce7e2] bg-white font-mono focus:outline-hidden focus:border-[#008b5b]"
              >
                <option value="gemini-3.8-flash">gemini-3.8-flash (General Tasks)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Responses)</option>
                <option value="gemini-4-argon">gemini-4-argon (Complex Analysis)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#10243b] mb-1">
                Chatbot Role (System Instruction)
              </label>
              <select
                value={selectedRole}
                onChange={(e: any) => setSelectedRole(e.target.value)}
                className="w-full py-2 px-3 text-xs sm:text-sm rounded-xl border border-[#dce7e2] bg-white focus:outline-hidden focus:border-[#008b5b]"
              >
                <option value="advisor">Senior Sustainability Advisor</option>
                <option value="zero_waste">Zero-Waste Lifestyle Guide</option>
                <option value="commute">Clean Commute Specialist</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable Messages Thread */}
      <div className="flex-1 bg-white rounded-2xl border border-[#e8efed] p-4 sm:p-5 overflow-y-auto space-y-4 shadow-inner">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser ? 'bg-[#10243b] text-white' : 'bg-[#e4f7eb] text-[#008b5b]'
                }`}
              >
                {isUser ? <User size={15} /> : <Bot size={15} />}
              </div>

              <div
                className={`max-w-[82%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#10243b] text-white rounded-tr-xs'
                    : 'bg-[#f4f8f6] text-[#10243b] border border-[#e8efed] rounded-tl-xs'
                }`}
              >
                <div className="whitespace-pre-line">{m.content}</div>
                <div
                  className={`mt-1.5 flex items-center gap-2 text-[10px] ${
                    isUser ? 'text-white/70 justify-end' : 'text-[#899ba8] justify-start'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {m.modelUsed && <span className="font-mono">· {m.modelUsed}</span>}
                </div>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#e4f7eb] text-[#008b5b] flex items-center justify-center shrink-0">
              <Bot size={15} />
            </div>
            <div className="bg-[#f4f8f6] border border-[#e8efed] rounded-2xl py-2.5 px-4 flex items-center gap-2 text-xs text-[#53667b]">
              <Loader2 size={14} className="animate-spin text-[#008b5b]" />
              <span>Thinking with {selectedModel}…</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex gap-2 overflow-x-auto py-1 shrink-0 scrollbar-none">
        {[
          'How can I reduce my plastic use?',
          'What is the footprint difference of oat milk vs dairy?',
          'How do Green Points work for verified planting?',
          'Help me calculate avoided CO2 for a 5km cycle commute',
        ].map((promptText) => (
          <button
            key={promptText}
            type="button"
            onClick={() => handleSendMessage(undefined, promptText)}
            className="py-1.5 px-3 bg-[#f1efff] hover:bg-[#e6e2ff] text-[#554ebd] text-xs font-semibold rounded-xl whitespace-nowrap transition border border-[#ded9ff] shrink-0"
          >
            {promptText}
          </button>
        ))}
      </div>

      {error && <MessageBox message={error} isError />}

      {/* Input Form with Audio Transcription (gemini-3.5-transcribe) */}
      <form
        onSubmit={handleSendMessage}
        className="bg-white p-2 sm:p-2.5 rounded-2xl border border-[#dce7e2] shadow-sm flex items-center gap-2 shrink-0"
      >
        {/* Microphone audio record button */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing || isSending}
          className={`p-2.5 rounded-xl transition flex items-center gap-1.5 shrink-0 ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : isTranscribing
              ? 'bg-amber-100 text-amber-800'
              : 'bg-[#f4f8f6] hover:bg-[#e4f7eb] text-[#008b5b]'
          }`}
          title={isRecording ? 'Click to stop recording & transcribe' : 'Transcribe audio via microphone (gemini-3.5-transcribe)'}
        >
          {isTranscribing ? (
            <Loader2 size={17} className="animate-spin" />
          ) : isRecording ? (
            <>
              <MicOff size={17} />
              <span className="text-xs font-mono">{recordingSeconds}s</span>
            </>
          ) : (
            <Mic size={17} />
          )}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isRecording
              ? 'Recording audio from microphone… Click red button to transcribe.'
              : isTranscribing
              ? 'Transcribing audio with gemini-3.5-transcribe…'
              : 'Ask CarbonLens AI or click mic to speak...'
          }
          disabled={isSending}
          className="flex-1 py-2 px-2 text-xs sm:text-sm bg-transparent focus:outline-hidden text-[#10243b]"
        />

        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="p-2.5 bg-[#008b5b] hover:bg-[#007749] text-white rounded-xl transition disabled:opacity-40 disabled:hover:bg-[#008b5b] shrink-0"
          title="Send message"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
