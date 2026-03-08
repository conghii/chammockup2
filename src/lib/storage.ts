import { GeneratedMockup, Season, PromptTemplate, AppSettings } from '@/types';

const KEYS = {
  MOCKUPS: 'chammockup:mockups',
  CUSTOM_SEASONS: 'chammockup:custom_seasons',
  PROMPT_TEMPLATES: 'chammockup:prompt_templates',
  SETTINGS: 'chammockup:settings',
  PROMPT_HISTORY: 'chammockup:prompt_history',
};

function safeGet<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable
  }
}

// Mockups
export function getMockups(): GeneratedMockup[] {
  return safeGet<GeneratedMockup[]>(KEYS.MOCKUPS, []);
}

export function saveMockup(mockup: GeneratedMockup) {
  const existing = getMockups();
  safeSet(KEYS.MOCKUPS, [mockup, ...existing]);
}

export function deleteMockup(id: string) {
  const existing = getMockups().filter((m) => m.id !== id);
  safeSet(KEYS.MOCKUPS, existing);
}

export function toggleFavoriteMockup(id: string) {
  const existing = getMockups().map((m) =>
    m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
  );
  safeSet(KEYS.MOCKUPS, existing);
}

// Custom seasons
export function getCustomSeasons(): Season[] {
  return safeGet<Season[]>(KEYS.CUSTOM_SEASONS, []);
}

export function saveCustomSeason(season: Season) {
  const existing = getCustomSeasons();
  safeSet(KEYS.CUSTOM_SEASONS, [...existing, season]);
}

export function deleteCustomSeason(id: string) {
  const existing = getCustomSeasons().filter((s) => s.id !== id);
  safeSet(KEYS.CUSTOM_SEASONS, existing);
}

// Prompt templates
export function getPromptTemplates(): PromptTemplate[] {
  return safeGet<PromptTemplate[]>(KEYS.PROMPT_TEMPLATES, []);
}

export function savePromptTemplate(template: PromptTemplate) {
  const existing = getPromptTemplates();
  safeSet(KEYS.PROMPT_TEMPLATES, [template, ...existing]);
}

export function deletePromptTemplate(id: string) {
  const existing = getPromptTemplates().filter((t) => t.id !== id);
  safeSet(KEYS.PROMPT_TEMPLATES, existing);
}

// Prompt history
export function getPromptHistory(): string[] {
  return safeGet<string[]>(KEYS.PROMPT_HISTORY, []);
}

export function addPromptHistory(prompt: string) {
  const existing = getPromptHistory().filter((p) => p !== prompt);
  safeSet(KEYS.PROMPT_HISTORY, [prompt, ...existing].slice(0, 20));
}

// Settings
const DEFAULT_SETTINGS: AppSettings = {
  providers: [
    {
      id: 'gemini',
      name: 'Google Gemini',
      apiKey: '',
      model: 'gemini-2.5-flash-image',
      models: [
        { value: 'gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image', description: 'Balanced speed & quality (Lower 429 errors)' },
        { value: 'gemini-3.1-flash-image-preview', label: 'Gemini 3.1 Flash Image', description: 'Latest model, high-quality image generation' },
        { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image', description: 'Professional grade image quality' },
        { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', description: 'Best for text & image analysis' },
        { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash', description: 'Fastest for language processing' },
      ],
    },
    {
      id: 'openai',
      name: 'OpenAI',
      apiKey: '',
      model: 'dall-e-3',
      models: [
        { value: 'dall-e-3', label: 'DALL-E 3', description: 'Highest quality, supports HD' },
        { value: 'dall-e-2', label: 'DALL-E 2', description: 'Faster and cheaper' },
      ],
    },
    {
      id: 'ideogram',
      name: 'Ideogram',
      apiKey: '',
      model: 'V_2',
      models: [
        { value: 'V_2', label: 'Ideogram v2', description: 'Best for text in images' },
        { value: 'V_2_TURBO', label: 'Ideogram v2 Turbo', description: 'Faster than v2' },
        { value: 'V_1', label: 'Ideogram v1', description: 'Classic version' },
        { value: 'V_1_TURBO', label: 'Ideogram v1 Turbo', description: 'Fastest and cheapest' },
      ],
    },
  ],
  activeProvider: 'gemini',
  theme: 'system',
  defaultGarmentType: 'tshirt',
  defaultDisplayType: 'flat_lay',
};

export function getSettings(): AppSettings {
  const stored = safeGet<Partial<AppSettings>>(KEYS.SETTINGS, {});
  // Merge stored providers while prioritizing the NEW model lists from DEFAULT_SETTINGS
  const mergedProviders = DEFAULT_SETTINGS.providers.map((defaultProvider) => {
    const stored_ = (stored.providers ?? []).find((p) => p.id === defaultProvider.id);
    return stored_ ? {
      ...defaultProvider,
      ...stored_,
      // Force the latest model definitions from code
      models: defaultProvider.models
    } : defaultProvider;
  });
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    providers: mergedProviders,
  };
}

export function saveSettings(settings: AppSettings) {
  safeSet(KEYS.SETTINGS, settings);
}
