'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import SeasonPicker from '@/components/generator/SeasonPicker';
import HobbyPicker from '@/components/generator/HobbyPicker';
import GarmentPicker from '@/components/generator/GarmentPicker';
import DisplayPicker from '@/components/generator/DisplayPicker';
import DesignInput from '@/components/generator/DesignInput';
import PromptPreview from '@/components/generator/PromptPreview';
import ResultGrid from '@/components/generator/ResultGrid';
import { cn } from '@/lib/utils';
import { Wand2, ChevronDown, ChevronUp } from 'lucide-react';
import { AIProviderId } from '@/types';

const PROVIDER_EMOJI: Record<AIProviderId, string> = {
  openai: '🤖',
  gemini: '✨',
  ideogram: '🎨',
  midjourney: '🚢',
};

function ProviderModelPicker() {
  const { settings, updateSettings } = useAppStore();
  const activeProvider = settings.providers.find((p) => p.id === settings.activeProvider);
  if (!activeProvider) return null;

  const setProvider = (id: AIProviderId) => {
    updateSettings({ ...settings, activeProvider: id });
  };

  const setModel = (model: string) => {
    updateSettings({
      ...settings,
      providers: settings.providers.map((p) =>
        p.id === settings.activeProvider ? { ...p, model } : p
      ),
    });
  };

  return (
    <div className="mb-2 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 space-y-2">
      {/* Provider row */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-14 flex-shrink-0">Provider</span>
        <div className="flex gap-1.5 flex-wrap">
          {settings.providers.map((p) => (
            <button
              key={p.id}
              onClick={() => setProvider(p.id)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all',
                settings.activeProvider === p.id
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-violet-400 hover:text-violet-600'
              )}
            >
              {PROVIDER_EMOJI[p.id]} {p.name}
              {!p.apiKey && <span className="text-amber-400 text-[10px]">⚠</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Model row */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 w-14 flex-shrink-0">Model</span>
        <div className="flex gap-1.5 flex-wrap">
          {activeProvider.models.map((m) => (
            <button
              key={m.value}
              onClick={() => setModel(m.value)}
              className={cn(
                'px-2 py-1 rounded-lg text-xs font-medium transition-all',
                activeProvider.model === m.value
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-600'
                  : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-violet-300 hover:text-violet-600'
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {!activeProvider.apiKey && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400">
          ⚠ No API key — go to <strong>Settings</strong> to add your key
        </p>
      )}
    </div>
  );
}

const STEPS = [
  { id: 'season', label: 'Season', emoji: '🗓️' },
  { id: 'garment', label: 'Garment', emoji: '👕' },
  { id: 'display', label: 'Display', emoji: '📸' },
  { id: 'design', label: 'Design', emoji: '✏️' },
  { id: 'prompt', label: 'Prompt', emoji: '🤖' },
];

function StepSection({
  id,
  label,
  emoji,
  isOpen,
  onToggle,
  isComplete,
  description,
  children,
}: {
  id: string;
  label: string;
  emoji: string;
  isOpen: boolean;
  onToggle: () => void;
  isComplete: boolean;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(
      'rounded-2xl border-2 transition-all',
      isOpen
        ? 'border-violet-300 dark:border-violet-700 shadow-md'
        : isComplete
          ? 'border-green-200 dark:border-green-800'
          : 'border-gray-200 dark:border-gray-700'
    )}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">{emoji}</span>
            <span className={cn(
              'font-semibold truncate',
              isOpen ? 'text-violet-700 dark:text-violet-300' : 'text-gray-900 dark:text-white'
            )}>{label}</span>
            {isComplete && !isOpen && (
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold uppercase">
                ✓
              </span>
            )}
          </div>
          {isOpen && description && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
              {description}
            </p>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-5">
          <div className="h-px bg-gray-100 dark:bg-gray-800 mb-4" />
          {children}
        </div>
      )}
    </div>
  );
}

export default function GeneratorPage() {
  const { config, generate, isGenerating, composedPrompt } = useAppStore();
  const [openStep, setOpenStep] = useState<string>('season');

  const toggle = (id: string) => setOpenStep((prev) => (prev === id ? '' : id));

  const isSeasonDone = !!config.season;
  const isHobbyDone = !!(config.hobbies && config.hobbies.length > 0);
  const isGarmentDone = !!config.garmentType;
  const isDisplayDone = !!config.displayType;
  const isDesignDone = !!(config.designText || (config.uploadedImageBase64 && config.uploadedImageAnalysis));
  const isPromptDone = !!(config.useCustomPrompt ? config.customPrompt : composedPrompt);

  const canGenerate = isSeasonDone && (isDesignDone || isPromptDone);

  return (
    <div className="flex gap-6 h-full min-h-0">
      {/* Left panel - flex container for sticky bottom button */}
      <div className="w-[380px] xl:w-[420px] flex-shrink-0 flex flex-col h-full border-r border-gray-100 dark:border-gray-800">
        {/* Scrollable config steps */}
        <div className="flex-1 overflow-y-auto pr-4 space-y-3 pb-6 custom-scrollbar">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg mb-4">
            <h3 className="font-bold text-sm flex items-center gap-2 mb-1">
              ✨ Quick Guide
            </h3>
            <p className="text-[11px] opacity-90 leading-relaxed font-medium">
              Select a <strong>Season</strong> and <strong>Garment</strong>. Upload your design in <strong>Step 4</strong>. AI will automatically match colors and preserve your graphic 100%. Click <strong>Generate</strong> to see results!
            </p>
          </div>

          <StepSection
            id="season"
            label="1. Select Season"
            emoji="🗓️"
            isOpen={openStep === 'season'}
            onToggle={() => toggle('season')}
            isComplete={isSeasonDone}
            description="Choose a season or event. AI will generate the perfect background and lighting for your niche."
          >
            <SeasonPicker />
          </StepSection>

          <StepSection
            id="hobby"
            label="2. Select Hobby Niche"
            emoji="🎯"
            isOpen={openStep === 'hobby'}
            onToggle={() => toggle('hobby')}
            isComplete={isHobbyDone}
            description="Optional: Combine your season with a specific hobby (e.g., Fishing, Yoga) for cross-niching."
          >
            <HobbyPicker />
          </StepSection>

          <StepSection
            id="garment"
            label="3. Choose Garment"
            emoji="👕"
            isOpen={openStep === 'garment'}
            onToggle={() => toggle('garment')}
            isComplete={isGarmentDone}
            description="Select your apparel type. If you upload a design in Step 5, AI will auto-detect the intended product color."
          >
            <GarmentPicker />
          </StepSection>

          <StepSection
            id="display"
            label="4. Display Style"
            emoji="📸"
            isOpen={openStep === 'display'}
            onToggle={() => toggle('display')}
            isComplete={isDisplayDone}
            description="Select your layout: Model mockups, flat lays, hanging products, or ghost mannequins."
          >
            <DisplayPicker />
          </StepSection>

          <StepSection
            id="design"
            label="5. Design Input"
            emoji="✏️"
            isOpen={openStep === 'design'}
            onToggle={() => toggle('design')}
            isComplete={isDesignDone}
            description="Upload your artwork. AI will keep your original design 100% intact without modifications."
          >
            <DesignInput />
          </StepSection>

          <StepSection
            id="prompt"
            label="6. Review Prompt"
            emoji="🤖"
            isOpen={openStep === 'prompt'}
            onToggle={() => toggle('prompt')}
            isComplete={isPromptDone}
            description="Review the optimized AI prompt and generated Etsy SEO tags for your new mockup."
          >
            <PromptPreview />
          </StepSection>

        </div>

        {/* Fixed bottom controls */}
        <div className="pt-4 pb-2 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
          <ProviderModelPicker />
          <button
            onClick={generate}
            disabled={!canGenerate || isGenerating}
            className={cn(
              'w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition-all shadow-lg',
              canGenerate && !isGenerating
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-0.5'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
            )}
          >
            <Wand2 className={cn('w-5 h-5', isGenerating && 'animate-spin')} />
            {isGenerating ? 'Generating...' : canGenerate ? 'Generate Mockup ✨' : 'Select Season & Design to Generate'}
          </button>
          {!isSeasonDone && (
            <p className="text-center text-xs text-gray-400 mt-2">
              Start by selecting a season above
            </p>
          )}
        </div>
      </div>

      {/* Right panel - expansive results */}
      <div className="flex-1 overflow-y-auto pl-2">
        <div className="sticky top-0 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-white">Generated Mockups</h2>
          </div>
          <ResultGrid />
        </div>
      </div>
    </div>
  );
}
