import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mic, BookOpen, Upload, TrendingUp, ChevronRight, Zap } from 'lucide-react';
import { api } from '../api';
import { LoadingSpinner } from '../components/UIComponents';

export default function HomePage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getProgress(), api.getQuestions()])
      .then(([prog, qs]) => {
        setProgress(prog);
        setQuestions(qs);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading your dashboard..." />;

  const completionPct = questions?.total
    ? Math.round(((progress?.completed_count || 0) / questions.total) * 100)
    : 0;

  const overallScore = progress?.average_scores?.overall || 0;

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">IELTS Speaking</h1>
        <p className="text-sm text-text-secondary mt-0.5">Practice & get AI feedback</p>
      </div>

      {/* Overall Score Card */}
      <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium">Overall Band Score</p>
            <p className="text-4xl font-bold mt-1">{overallScore > 0 ? overallScore.toFixed(1) : '--'}</p>
            <p className="text-white/60 text-xs mt-1">
              {progress?.total_practices || 0} practice sessions
            </p>
          </div>
          <div className="w-20 h-20 rounded-full border-4 border-white/30 flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold">{completionPct}%</p>
              <p className="text-[10px] text-white/60">Complete</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <div>
        <h2 className="text-base font-semibold mb-3">Quick Start</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/questions?part=1')}
            className="bg-white rounded-xl p-4 text-left shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
              <Mic size={20} className="text-blue-600" />
            </div>
            <p className="text-sm font-semibold">Part 1</p>
            <p className="text-xs text-text-secondary">Introduction</p>
          </button>
          <button
            onClick={() => navigate('/questions?part=2')}
            className="bg-white rounded-xl p-4 text-left shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-2">
              <BookOpen size={20} className="text-purple-600" />
            </div>
            <p className="text-sm font-semibold">Part 2</p>
            <p className="text-xs text-text-secondary">Cue Card</p>
          </button>
          <button
            onClick={() => navigate('/questions?part=3')}
            className="bg-white rounded-xl p-4 text-left shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-2">
              <Zap size={20} className="text-orange-600" />
            </div>
            <p className="text-sm font-semibold">Part 3</p>
            <p className="text-xs text-text-secondary">Discussion</p>
          </button>
          <button
            onClick={() => navigate('/settings')}
            className="bg-white rounded-xl p-4 text-left shadow-sm border border-gray-100 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-2">
              <Upload size={20} className="text-green-600" />
            </div>
            <p className="text-sm font-semibold">Upload PDF</p>
            <p className="text-xs text-text-secondary">Import questions</p>
          </button>
        </div>
      </div>

      {/* Score Dimensions */}
      {overallScore > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold">Score Breakdown</h2>
            <Link to="/progress" className="text-xs text-primary font-medium flex items-center gap-0.5">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
            {['fluency', 'vocabulary', 'grammar', 'pronunciation', 'coherence'].map((dim) => {
              const val = progress?.average_scores?.[dim] || 0;
              return (
                <div key={dim} className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary w-24 capitalize">{dim}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(val / 9) * 100}%`,
                        backgroundColor: val >= 7 ? '#00B894' : val >= 5.5 ? '#FDCB6E' : '#FF6B6B',
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold w-8 text-right">{val.toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Question Bank Stats */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Question Bank</h3>
          <span className="text-xs text-text-secondary">{questions?.total || 0} questions</span>
        </div>
        <div className="flex gap-4">
          {[1, 2, 3].map((p) => {
            const count = questions?.questions?.filter((q) => q.part === p).length || 0;
            return (
              <div key={p} className="flex-1 text-center">
                <p className="text-lg font-bold text-primary">{count}</p>
                <p className="text-[10px] text-text-secondary">Part {p}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
