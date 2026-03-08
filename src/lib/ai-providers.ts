import OpenAI from 'openai';

// Helper to parse multiple keys and rotate
function getKeys(apiKeys: string): string[] {
  return apiKeys.split(',').map(k => k.trim()).filter(Boolean);
}

// ─── OpenAI DALL-E ───────────────────────────────────────────────────────────

export async function generateWithOpenAI(
  apiKeys: string,
  prompt: string,
  count = 1,
  model = 'dall-e-3'
): Promise<string[]> {
  const keys = getKeys(apiKeys);
  let lastError: any = null;

  for (const apiKey of keys) {
    try {
      const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      const size = '1024x1024';
      const quality = model === 'dall-e-3' ? 'hd' : 'standard';

      const requests = Array.from({ length: count }, () =>
        client.images.generate({
          model,
          prompt,
          n: 1,
          size,
          quality: quality as 'hd' | 'standard',
        })
      );

      const results = await Promise.all(requests);
      return results.map((r) => r.data?.[0]?.url ?? '').filter(Boolean);
    } catch (err: any) {
      lastError = err;
      // If quota exceeded or rate limit, try next key
      if (err.status === 429 || err.message?.toLowerCase().includes('quota') || err.message?.toLowerCase().includes('rate limit')) {
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error('All OpenAI API keys failed');
}

// ─── Google Gemini ────────────────────────────────────────────────────────────

export async function generateWithGemini(
  apiKeys: string,
  prompt: string,
  count = 1,
  model = 'gemini-2.0-flash-preview-image-generation',
  imageBase64?: string
): Promise<string[]> {
  const keys = getKeys(apiKeys);
  let lastError: any = null;

  for (const apiKey of keys) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const parts: any[] = [{ text: prompt }];

      if (imageBase64) {
        const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        const mimeType = match?.[1] ?? 'image/jpeg';
        const data = match?.[2] ?? imageBase64;
        parts.push({ inline_data: { mime_type: mimeType, data } });
      }

      const results: string[] = [];
      const requests = Array.from({ length: Math.min(count, 4) }, () =>
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
          }),
        })
      );

      const responses = await Promise.all(requests);
      for (const res of responses) {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const msg = (err as { error?: { message?: string } }).error?.message ?? `Gemini error ${res.status}`;

          if (res.status === 429 || msg.toLowerCase().includes('quota')) {
            throw { status: 429, message: msg }; // Trigger retry
          }
          throw new Error(msg);
        }
        const data = (await res.json()) as any;
        const parts = data.candidates?.[0]?.content?.parts ?? [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType ?? 'image/png';
            results.push(`data:${mime};base64,${part.inlineData.data}`);
          }
        }
      }
      return results;
    } catch (err: any) {
      lastError = err;
      if (err.status === 429) continue;
      throw err;
    }
  }
  throw lastError || new Error('All Gemini API keys failed');
}

// ─── Ideogram ────────────────────────────────────────────────────────────────

export async function generateWithIdeogram(
  apiKeys: string,
  prompt: string,
  count = 1,
  model = 'V_2'
): Promise<string[]> {
  const keys = getKeys(apiKeys);
  let lastError: any = null;

  for (const apiKey of keys) {
    try {
      const res = await fetch('https://api.ideogram.ai/generate', {
        method: 'POST',
        headers: {
          'Api-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_request: {
            prompt,
            model,
            aspect_ratio: 'ASPECT_1_1',
            num_images: Math.min(count, 4),
          },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = (err as any).message ?? (err as any).error ?? `Ideogram error ${res.status}`;
        if (res.status === 429 || msg.toLowerCase().includes('quota')) {
          throw { status: 429, message: msg };
        }
        throw new Error(msg);
      }

      const data = (await res.json()) as { data?: Array<{ url?: string }> };
      return (data.data ?? []).map((d) => d.url ?? '').filter(Boolean);
    } catch (err: any) {
      lastError = err;
      if (err.status === 429) continue;
      throw err;
    }
  }
  throw lastError || new Error('All Ideogram API keys failed');
}

// ─── Vision: phân tích ảnh áo ────────────────────────────────────────────────

const VISION_PROMPT = `Analyze this shirt/garment image and provide a concise description in English covering:
1. Garment type and color
2. Design/graphic: text content, illustration style, colors used
3. Overall theme and mood
4. Font/typography style if text is present
5. Notable icons, motifs, or graphical elements
Be specific and visual. Under 150 words.`;

export async function analyzeShirtImageWithGemini(
  apiKeys: string,
  imageBase64: string
): Promise<string> {
  const keys = getKeys(apiKeys);
  let lastError: any = null;

  for (const apiKey of keys) {
    try {
      const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      const mimeType = match?.[1] ?? 'image/jpeg';
      const base64Data = match?.[2] ?? imageBase64;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: base64Data } },
              { text: VISION_PROMPT },
            ],
          }],
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = (err as any).error?.message ?? `Gemini vision error ${res.status}`;
        if (res.status === 429 || msg.toLowerCase().includes('quota')) {
          throw { status: 429, message: msg };
        }
        throw new Error(msg);
      }

      const data = (await res.json()) as any;
      return data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text?.trim() ?? '';
    } catch (err: any) {
      lastError = err;
      if (err.status === 429) continue;
      throw err;
    }
  }
  throw lastError || new Error('All Gemini API keys for vision failed');
}

// ─── Test API key ─────────────────────────────────────────────────────────────

export async function testApiKey(providerId: string, apiKeys: string): Promise<boolean> {
  const keys = getKeys(apiKeys);
  if (keys.length === 0) return false;

  // Test only the first key for validation
  const apiKey = keys[0];
  try {
    if (providerId === 'openai') {
      const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
      await client.models.list();
      return true;
    }
    if (providerId === 'gemini') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      return res.ok;
    }
    if (providerId === 'ideogram') {
      const res = await fetch('https://api.ideogram.ai/user/credits', {
        headers: { 'Api-Key': apiKey },
      });
      return res.ok;
    }
    return false;
  } catch {
    return false;
  }
}
