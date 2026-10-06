import type { Ink } from '../types';

/**
 * Call Google Input Tools Handwriting API for English (en)
 */
export async function recognizeEnglishWithGoogle(
  ink: Ink,
  width: number,
  height: number
): Promise<string[]> {
  if (!ink || ink.length === 0) return [];

  try {
    const formattedInk = ink.map(stroke => [
      stroke.map(p => Math.round(p[0])),
      stroke.map(p => Math.round(p[1])),
      stroke.map(p => Math.round(p[2]))
    ]);

    const payload = {
      app_version: 0.4,
      api_level: '533.0.0',
      device: navigator.userAgent,
      input_type: '0',
      options: 'enable_pre_space',
      requests: [
        {
          writing_guide: {
            writing_area_width: Math.round(width),
            writing_area_height: Math.round(height)
          },
          ink: formattedInk,
          language: 'en'
        }
      ]
    };

    const res = await fetch('https://inputtools.google.com/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.warn('Google English handwriting API returned status:', res.status);
      return [];
    }

    const data = await res.json();
    if (data && data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1]) {
      const candidates = data[1][0][1] as string[];
      return candidates.map(c => c.trim()).filter(c => c.length > 0);
    }
  } catch (err) {
    console.warn('Google English handwriting API failed (manual review supported):', err);
  }

  return [];
}
