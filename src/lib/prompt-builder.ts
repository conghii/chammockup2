import { GeneratorConfig, DisplayType, GarmentType, DesignStyle } from '@/types';

const DISPLAY_PROMPTS: Record<DisplayType, string> = {
  flat_lay:
    'High-end commercial flat lay product photography, shot from directly above on a premium textured surface, professional arrangement with minimal seasonal props, soft diffused studio lighting',
  hanging:
    'A professional product shot of a garment hanging on a minimalist wooden hanger against a neutral gallery wall, crisp details, natural side lighting, realistic fabric folds',
  folded:
    'A clean, professional photo of a neatly folded garment on a boutique shelf, soft bokeh background, focus on the fabric texture and quality',
  model_wearing:
    'A high-fashion lifestyle photo of a professional model wearing a',
  ghost_mannequin:
    'Premium ghost mannequin (invisible mannequin) e-commerce photography, perfectly shaped garment, 3D effect, clean white background, high-end studio lighting',
  lifestyle:
    'A candid, high-resolution lifestyle photograph featuring a person wearing a',
};

const GARMENT_LABELS: Record<GarmentType, string> = {
  tshirt: 'crew-neck t-shirt',
  vneck: 'v-neck t-shirt',
  longsleeve: 'long-sleeve shirt',
  sweatshirt: 'crewneck sweatshirt',
  hoodie: 'pullover hoodie',
  tanktop: 'tank top',
  croptop: 'crop top',
};

const STYLE_PROMPTS: Record<DesignStyle, string> = {
  retro: 'retro 70s-inspired',
  vintage: 'vintage distressed',
  minimalist: 'clean minimalist',
  distressed: 'grunge distressed texture',
  hand_lettered: 'hand-lettered brush script',
  bold_graphic: 'bold graphic illustration',
  watercolor: 'soft watercolor illustration',
  sublimation: 'all-over vibrant sublimation print',
};

export function buildPrompt(config: GeneratorConfig): string {
  if (!config.season) return '';

  const { season, garmentType, garmentColor, displayType, designText, designStyle, uploadedImageAnalysis, uploadedImageBase64 } = config;

  const displayIntro = DISPLAY_PROMPTS[displayType];
  const garmentLabel = GARMENT_LABELS[garmentType];
  const styleLabel = STYLE_PROMPTS[designStyle];
  const colorPalette = season.colors.map((c) => c.name).join(', ');
  const keywords = season.keywords.slice(0, 4).join(', ');

  let prompt = '';

  if (uploadedImageBase64) {
    prompt = `${displayIntro}. Use the provided image as the absolute reference for both the graphic design and the garment color.`;
  } else if (displayType === 'flat_lay') {
    prompt = `${displayIntro}. The garment is a ${garmentColor.name.toLowerCase()} ${garmentLabel}`;
  } else if (displayType === 'hanging' || displayType === 'folded') {
    prompt = `${displayIntro} of a ${garmentColor.name.toLowerCase()} ${garmentLabel}`;
  } else {
    prompt = `${displayIntro} ${garmentColor.name.toLowerCase()} ${garmentLabel}`;
  }

  if (uploadedImageBase64) {
    prompt += ` Render a high-fidelity mockup by applying the design exactly as it appears onto the ${garmentLabel}. CRITICAL: You must match the garment color (shirt color) perfectly from the source image. Do not change the shirt color even if it contrasts with the seasonal theme.`;
    if (designText) {
      prompt += ` Verify the text "${designText}" is rendered exactly as shown in the reference.`;
    }
    prompt += ` Environment Context: ${season.name} season with ${keywords} atmosphere. Only use the seasonal color palette (${colorPalette}) for background elements, lighting, and decorative props. The garment itself must remain exactly the color shown in the upload.`;
  } else if (designText) {
    prompt += ` with a ${styleLabel} design`;
    prompt += `. The design features the text "${designText}" in ${styleLabel} typography`;
    prompt += `, surrounded by ${season.name} elements like ${keywords}`;
    prompt += `. Color palette: ${colorPalette}`;
  } else {
    prompt += ` with a ${styleLabel} ${season.name} themed design`;
    prompt += ` featuring ${keywords} elements`;
    prompt += `. Color palette: ${colorPalette}`;
  }

  const seasonContext: Record<string, string> = {
    halloween: 'The background scene is set in a realistic autumnal dusk, with glowing pumpkins and subtle spooky shadows in a modern home setting',
    christmas: 'The background environment is warm and cozy, featuring a soft-focus Christmas tree with glowing fairy lights and a fireplace in the background',
    valentines: 'The background is a romantic and elegant setting with soft pink lighting, fresh roses, and a clean premium aesthetic',
    july4th: 'The background is a bright, sunny outdoor celebration with clear blue skies and tasteful patriotic decorations',
    thanksgiving: 'The background is a warm, inviting dining area with natural wooden textures, dried autumn leaves, and golden hour lighting',
    summer: 'The background is a vibrant outdoor scene with bright midday sun, tropical plant shadows, and a clear summer atmosphere',
    fall: 'The background consists of a crisp autumn day with soft golden sunlight filtering through changing leaves, cozy and warm textures',
    winter: 'The background is a bright winter morning with soft cool light, subtle frost details, and a clean minimalist interior',
    spring: 'The background is a fresh morning setting with natural sunlight, blooming florals in soft focus, and an airy, bright atmosphere',
  };

  if (seasonContext[season.id]) {
    prompt += `. ${seasonContext[season.id]}`;
  }

  prompt += '. Ultra-photorealistic 8k UHD commercial fashion photography. Shot on Sony A7R IV, 35mm lens, f/2.8, soft natural lighting, sharp focus on fabric texture, high-end studio quality, clean and premium composition.';

  return prompt;
}

export function buildEtsyTags(config: GeneratorConfig): string[] {
  if (!config.season) return [];

  const { season, garmentType, designStyle } = config;
  const garmentLabel = GARMENT_LABELS[garmentType];

  const tags = [
    season.name.toLowerCase(),
    `${season.name.toLowerCase()} shirt`,
    `${season.name.toLowerCase()} ${garmentLabel}`,
    `${garmentLabel} gift`,
    ...season.keywords.slice(0, 5),
    designStyle.replace('_', ' '),
    'print on demand',
    'graphic tee',
    'unisex shirt',
    'gift idea',
    'USA seller',
  ];

  if (config.designText) {
    const words = config.designText.toLowerCase().split(' ');
    tags.push(...words.filter((w) => w.length > 3).slice(0, 3));
  }

  return [...new Set(tags)].slice(0, 13);
}
