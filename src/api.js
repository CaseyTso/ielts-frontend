// In production (Vercel), use the Render backend URL from env var
// In development, proxy through Vite (/api -> localhost:8000)
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

// ---------- localStorage config helpers ----------
const CONFIG_KEY = 'ielts-settings';

export function loadConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {
    apiKey: '',
    baseUrl: 'https://yinli.one/v1',
    modelStt: 'whisper-1',
    modelEval: 'gpt-4o',
    modelPronunciation: 'gpt-4o-audio-preview',
    modelPdf: 'deepseek-chat',
  };
}

export function saveConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function configHeaders() {
  const cfg = loadConfig();
  const h = {};
  if (cfg.apiKey) h['x-api-key'] = cfg.apiKey;
  if (cfg.baseUrl) h['x-base-url'] = cfg.baseUrl;
  if (cfg.modelStt) h['x-model-stt'] = cfg.modelStt;
  if (cfg.modelEval) h['x-model-eval'] = cfg.modelEval;
  if (cfg.modelPronunciation) h['x-model-pronunciation'] = cfg.modelPronunciation;
  if (cfg.modelPdf) h['x-model-pdf'] = cfg.modelPdf;
  return h;
}

// ---------- Request helper ----------
async function request(url, options = {}) {
  const headers = { ...configHeaders(), ...(options.headers || {}) };
  // When body is FormData, browser must set Content-Type with boundary automatically.
  // Remove any manually set Content-Type so the browser can handle it.
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  getHealth: () => request('/health'),

  testConnection: () => request('/test-connection', { method: 'POST' }),

  getQuestions: (part = 0, topic = '') => {
    const params = new URLSearchParams();
    if (part) params.set('part', part);
    if (topic) params.set('topic', topic);
    return request(`/questions?${params}`);
  },

  uploadPdf: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/upload-pdf', { method: 'POST', body: form });
  },

  transcribe: async (audioBlob) => {
    // Call the STT API directly from the browser.
    const cfg = loadConfig();
    if (!cfg.apiKey) {
      return { transcript: '', error: 'AI not configured. Please set your API key in Settings.' };
    }
    const baseUrl = cfg.baseUrl || 'https://yinli.one/v1';
    const sttModel = cfg.modelStt || 'whisper-1';

    try {
      // Materialize blob into a contiguous buffer, then build a File.
      const arrBuf = await audioBlob.arrayBuffer();
      const bytes = new Uint8Array(arrBuf);
      const ext = audioBlob.type === 'audio/wav' ? 'wav' : 'webm';
      const mime = audioBlob.type || (ext === 'wav' ? 'audio/wav' : 'audio/webm');
      const file = new File([bytes], `recording.${ext}`, { type: mime });

      // Build the multipart body manually to ensure Content-Length is exact.
      // Some Go reverse-proxies fail with chunked transfer encoding that
      // browser FormData + fetch may produce.
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);
      const encoder = new TextEncoder();

      // Text fields
      const textParts = [
        `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\n${sttModel}\r\n`,
        `--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\nen\r\n`,
      ];
      // File part header + footer
      const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${file.name}"\r\nContent-Type: ${mime}\r\n\r\n`;
      const fileFooter = `\r\n--${boundary}--\r\n`;

      // Combine into a single Blob so Content-Length is known upfront
      const bodyBlob = new Blob([
        ...textParts.map(t => encoder.encode(t)),
        encoder.encode(fileHeader),
        bytes,
        encoder.encode(fileFooter),
      ], { type: `multipart/form-data; boundary=${boundary}` });

      const res = await fetch(`${baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.apiKey}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': String(bodyBlob.size),
        },
        body: bodyBlob,
      });
      const body = await res.json();
      if (!res.ok) {
        return { transcript: '', error: `Transcription failed (model: ${sttModel}): ${JSON.stringify(body)}` };
      }
      return { transcript: body.text || '' };
    } catch (e) {
      return { transcript: '', error: `Transcription failed: ${e.message}` };
    }
  },

  evaluate: (data) =>
    request('/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  evaluateAudio: (audioBlob, questionId, questionText, part) => {
    const ext = audioBlob.type === 'audio/wav' ? 'wav' : 'webm';
    const form = new FormData();
    form.append('audio', audioBlob, `recording.${ext}`);
    form.append('question_id', questionId);
    form.append('question_text', questionText);
    form.append('part', part);
    return request('/evaluate-audio', { method: 'POST', body: form });
  },

  getProgress: () => request('/progress'),
  resetProgress: () => request('/reset-progress', { method: 'POST' }),
};
