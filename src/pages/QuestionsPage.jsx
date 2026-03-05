import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight, CheckCircle2 } from 'lucide-react';
import { api } from '../api';
import { PartBadge, LoadingSpinner, EmptyState } from '../components/UIComponents';

export default function QuestionsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [topics, setTopics] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const activePart = parseInt(searchParams.get('part') || '0');
  const activeTopic = searchParams.get('topic') || '';

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getQuestions(activePart, activeTopic), api.getProgress()])
      .then(([data, prog]) => {
        setQuestions(data.questions);
        setTopics(data.topics);
        setCompletedIds(prog.completed_questions || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activePart, activeTopic]);

  const filtered = search
    ? questions.filter(
        (q) =>
          q.text.toLowerCase().includes(search.toLowerCase()) ||
          q.topic.toLowerCase().includes(search.toLowerCase())
      )
    : questions;

  const setFilter = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) next.set(key, val);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="px-4 pt-6 pb-4">
      <h1 className="text-xl font-bold mb-4">Question Bank</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Part Filter */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {[0, 1, 2, 3].map((p) => (
          <button
            key={p}
            onClick={() => setFilter('part', p || '')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activePart === p
                ? 'bg-primary text-white'
                : 'bg-white text-text-secondary border border-gray-200'
            }`}
          >
            {p === 0 ? 'All Parts' : `Part ${p}`}
          </button>
        ))}
      </div>

      {/* Topic Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter('topic', '')}
          className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
            !activeTopic
              ? 'bg-accent text-white'
              : 'bg-white text-text-secondary border border-gray-200'
          }`}
        >
          All Topics
        </button>
        {topics.map((t) => (
          <button
            key={t}
            onClick={() => setFilter('topic', t)}
            className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
              activeTopic === t
                ? 'bg-accent text-white'
                : 'bg-white text-text-secondary border border-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Questions List */}
      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState title="No questions found" description="Try changing your filters or upload a question bank PDF." />
      ) : (
        <div className="space-y-2">
          {filtered.map((q) => (
            <button
              key={q.id}
              onClick={() => navigate(`/practice/${q.id}`)}
              className="w-full bg-white rounded-xl p-4 text-left shadow-sm border border-gray-100 flex items-center gap-3 active:scale-[0.99] transition-transform"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <PartBadge part={q.part} />
                  <span className="text-[11px] text-text-secondary">{q.topic}</span>
                </div>
                <p className="text-sm font-medium text-text leading-snug line-clamp-2">{q.text}</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {completedIds.includes(q.id) && (
                  <CheckCircle2 size={18} className="text-success" />
                )}
                <ChevronRight size={18} className="text-gray-300" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
