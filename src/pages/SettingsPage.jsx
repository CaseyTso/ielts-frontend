import { useState, useEffect } from 'react';
import { Upload, Key, Globe, CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';
import { api } from '../api';
import { LoadingSpinner } from '../components/UIComponents';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://yinli.one/v1');
  const [aiConfigured, setAiConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);

  useEffect(() => {
    api.getSettings()
      .then((data) => {
        setAiConfigured(data.ai_configured);
        if (data.base_url) setBaseUrl(data.base_url);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await api.updateSettings(apiKey, baseUrl);
      setAiConfigured(result.ai_configured);
      setMessage({ type: result.ai_configured ? 'success' : 'error', text: result.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPdf = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <h1 className="text-xl font-bold">Settings</h1>

      {/* AI Status */}
      <div className={`rounded-xl p-4 flex items-center gap-3 ${
        aiConfigured ? 'bg-success/10 border border-success/20' : 'bg-warning/10 border border-warning/20'
      }`}>
        {aiConfigured ? (
          <CheckCircle size={22} className="text-success shrink-0" />
        ) : (
          <XCircle size={22} className="text-warning shrink-0" />
        )}
        <div>
          <p className="text-sm font-semibold">{aiConfigured ? 'AI Connected' : 'AI Not Configured'}</p>
          <p className="text-xs text-text-secondary">
            {aiConfigured
              ? 'AI-powered evaluation is active.'
              : 'Add your API key below to enable AI features. You can also type responses for demo evaluation.'}
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
            onClick={handleSaveApiKey}
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
        <p>IELTS Speaking Practice v1.0</p>
        <p className="mt-0.5">AI-Powered Speaking Evaluation</p>
      </div>
    </div>
  );
}
