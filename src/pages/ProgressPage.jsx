import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Target, RotateCcw, Award } from 'lucide-react';
import { api } from '../api';
import { LoadingSpinner, EmptyState } from '../components/UIComponents';

export default function ProgressPage() {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getProgress()
      .then(setProgress)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      await api.resetProgress();
      setProgress(await api.getProgress());
    }
  };

  if (loading) return <LoadingSpinner text="Loading progress..." />;

  if (!progress || progress.total_practices === 0) {
    return (
      <div className="px-4 pt-6">
        <h1 className="text-xl font-bold mb-4">Progress</h1>
        <EmptyState
          icon={TrendingUp}
          title="No practice sessions yet"
          description="Start practicing to track your progress and see your improvement over time."
          action={
            <Link to="/questions" className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
              Start Practicing
            </Link>
          }
        />
      </div>
    );
  }

  const scores = progress.average_scores;
  const dims = [
    { key: 'fluency', label: 'Fluency', color: '#6C5CE7', icon: '🗣️' },
    { key: 'vocabulary', label: 'Vocabulary', color: '#00CEC9', icon: '📚' },
    { key: 'grammar', label: 'Grammar', color: '#0984E3', icon: '📝' },
    { key: 'pronunciation', label: 'Pronunciation', color: '#E17055', icon: '🎯' },
    { key: 'coherence', label: 'Coherence', color: '#00B894', icon: '🔗' },
  ];

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Progress</h1>
        <button onClick={handleReset} className="p-2 text-text-secondary hover:text-danger">
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-primary">{scores.overall?.toFixed(1) || '--'}</p>
          <p className="text-[10px] text-text-secondary mt-0.5">Overall Band</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-accent">{progress.total_practices}</p>
          <p className="text-[10px] text-text-secondary mt-0.5">Sessions</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
          <p className="text-2xl font-bold text-success">{progress.completed_count}</p>
          <p className="text-[10px] text-text-secondary mt-0.5">Questions</p>
        </div>
      </div>

      {/* Score Dimensions */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Award size={16} className="text-primary" />
          Average Scores by Dimension
        </h2>
        <div className="space-y-4">
          {dims.map(({ key, label, color }) => {
            const val = scores[key] || 0;
            return (
              <div key={key}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-text">{label}</span>
                  <span className="text-sm font-bold" style={{ color }}>{val.toFixed(1)}</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${(val / 9) * 100}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Target size={16} className="text-accent" />
            Question Completion
          </h3>
          <span className="text-xs text-text-secondary">
            {progress.completed_count}/{progress.total_questions}
          </span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700"
            style={{
              width: `${progress.total_questions ? (progress.completed_count / progress.total_questions) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Recent Records */}
      {progress.recent_records?.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold mb-3">Recent Sessions</h2>
          <div className="space-y-2">
            {progress.recent_records.slice().reverse().map((record, i) => (
              <div key={i} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-secondary truncate">
                      {new Date(record.timestamp).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                    <p className="text-sm text-text truncate mt-0.5">{record.transcript?.slice(0, 80)}...</p>
                  </div>
                  <div className="ml-3 shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      (record.scores?.overall || 0) >= 7 ? 'bg-success' :
                      (record.scores?.overall || 0) >= 5.5 ? 'bg-warning' : 'bg-danger'
                    }`}>
                      {record.scores?.overall?.toFixed(1) || '--'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
