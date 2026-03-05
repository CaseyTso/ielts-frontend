// In production (Vercel), use the Render backend URL from env var
// In development, proxy through Vite (/api -> localhost:8000)
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  getHealth: () => request('/health'),
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
  transcribe: (audioBlob) => {
    const form = new FormData();
    form.append('audio', audioBlob, 'recording.webm');
    return request('/transcribe', { method: 'POST', body: form });
  },
  evaluate: (data) =>
    request('/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  evaluateAudio: (audioBlob, questionId, questionText, part) => {
    const form = new FormData();
    form.append('audio', audioBlob, 'recording.webm');
    form.append('question_id', questionId);
    form.append('question_text', questionText);
    form.append('part', part);
    return request('/evaluate-audio', { method: 'POST', body: form });
  },
  getProgress: () => request('/progress'),
  resetProgress: () => request('/reset-progress', { method: 'POST' }),
  getSettings: () => request('/settings'),
  updateSettings: (apiKey, baseUrl) =>
    request('/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, base_url: baseUrl }),
    }),
};
