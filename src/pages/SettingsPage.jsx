import { useState } from 'react';
import { Upload, Key, Globe, CheckCircle, XCircle, Loader2, FileText, Cpu } from 'lucide-react';
import { api, loadConfig, saveConfig } from '../api';

export default function SettingsPage() {
  const initial = loadConfig();
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [modelStt, setModelStt] = useState(initial.modelStt);
  const [modelEval, setModelEval] = useState(initial.modelEval);
  const [modelPronunciation, setModelPronunciation] = useState(initial.modelPronunciation);
  const [modelPdf, setModelPdf] = useState(initial.modelPdf);

  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  const persistConfig = () => {
    saveConfig({ apiKey, baseUrl, modelStt, modelEval, modelPronunciation, modelPdf });
  };

  const handleSaveAndTest = async () => {
    if (!apiKey.trim()) return;
    // Save to localStorage first so the API layer picks it up
    persistConfig();
    setSaving(true);
    setMessage(null);
    try {
      const result = await api.testConnection();
      setConnected(result.success);
      setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    } catch (err) {
      setConnected(false);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPdf = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Ensure latest config is saved before uploading
    persistConfig();
    setUploading(true);
    setUploadResult(null);
    try {
      const result = await api.uploadPdf(file);
      setUploadResult({ type: 'success', ...result });
    } catch (err) {
      setUploadResult({ type: 'error', message: err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* AI Status */}
      <div className={`rounded-xl p-4 flex items-center gap-3 ${
        connected ? 'bg-success/10 border border-success/20' : 'bg-warning/10 border border-warning/20'
      }`}>
        {connected ? (
          <CheckCircle size={22} className="text-success shrink-0" />
        ) : (
          <XCircle size={22} className="text-warning shrink-0" />
        )}
        <div>
          <p className="text-sm font-semibold">{connected ? 'AI Connected' : 'AI Not Connected'}</p>
          <p className="text-xs text-text-secondary">
            {connected
              ? 'AI-powered evaluation is active.'
              : apiKey
                ? 'Press "Save & Test" to verify your connection.'
                : 'Add your API key below to enable AI features.'}
          </p>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Key size={16} className="text-primary" />
          API Configuration
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text-secondary block mb-1">
              <Globe size={12} className="inline mr-1" />
              API Base URL
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://yinli.one/v1"
              className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <p className="text-[11px] text-text-secondary mt-1">
              Supports OpenAI-compatible API endpoints (e.g., yinli.one, openrouter.ai)
            </p>
          </div>

          <button
            onClick={handleSaveAndTest}
            disabled={saving || !apiKey.trim()}
            className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : null}
            {saving ? 'Testing Connection...' : 'Save & Test'}
          </button>

          {message && (
            <p className={`text-xs ${message.type === 'success' ? 'text-success' : 'text-danger'}`}>
              {message.text}
            </p>
          )}
        </div>
      </div>

      {/* Model Configuration */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Cpu size={16} className="text-primary" />
          Model Configuration
        </h2>
        <p className="text-[11px] text-text-secondary mb-4">
          Specify the model names available on your API endpoint. Changes are saved automatically.
        </p>

        <div className="space-y-3">
          <ModelInput label="Speech-to-Text (STT)" value={modelStt} onChange={setModelStt} onBlur={persistConfig} placeholder="whisper-1" />
          <ModelInput label="Evaluation" value={modelEval} onChange={setModelEval} onBlur={persistConfig} placeholder="gpt-4o" />
          <ModelInput label="Pronunciation Analysis" value={modelPronunciation} onChange={setModelPronunciation} onBlur={persistConfig} placeholder="gpt-4o-audio-preview" />
          <ModelInput label="PDF Parsing" value={modelPdf} onChange={setModelPdf} onBlur={persistConfig} placeholder="deepseek-chat" />
        </div>
      </div>

      {/* PDF Upload */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FileText size={16} className="text-primary" />
          Import Question Bank
        </h2>
        <p className="text-xs text-text-secondary mb-4">
          Upload a PDF file containing IELTS Speaking questions. The AI will automatically extract and categorize questions into Part 1, 2, and 3.
        </p>

        <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors ${
          uploading ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
        }`}>
          {uploading ? (
            <>
              <Loader2 size={28} className="text-primary animate-spin mb-2" />
              <p className="text-sm text-primary font-medium">Processing PDF...</p>
            </>
          ) : (
            <>
              <Upload size={28} className="text-gray-400 mb-2" />
              <p className="text-sm font-medium text-text">Tap to upload PDF</p>
              <p className="text-xs text-text-secondary mt-1">IELTS Speaking question bank</p>
            </>
          )}
          <input
            type="file"
            accept=".pdf"
            onChange={handleUploadPdf}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {uploadResult && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            uploadResult.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
          }`}>
            {uploadResult.type === 'success' ? (
              <>
                <p className="font-medium">{uploadResult.message}</p>
                <p className="text-xs mt-1">
                  Part 1: {uploadResult.by_part?.part1 || 0} | Part 2: {uploadResult.by_part?.part2 || 0} | Part 3: {uploadResult.by_part?.part3 || 0}
                </p>
              </>
            ) : (
              <p>{uploadResult.message}</p>
            )}
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="text-center text-xs text-text-secondary pt-4">
        <p>IELTS Speaking Practice v2.0</p>
        <p className="mt-0.5">AI-Powered Speaking Evaluation</p>
      </div>
    </div>
  );
}

/* ---------- Small helper component ---------- */
function ModelInput({ label, value, onChange, onBlur, placeholder }) {
  return (
    <div>
      <label className="text-xs font-medium text-text-secondary block mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-surface border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
    </div>
  );
}
