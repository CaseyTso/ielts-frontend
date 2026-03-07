import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Award, BookOpen, Lightbulb, RefreshCw, ArrowRight, MessageCircle } from 'lucide-react';
import { ScoreBadge, PartBadge } from '../components/UIComponents';

/* ---------- Score Radar Chart (simplified bar-based) ---------- */
function ScoreChart({ scores }) {
  const dims = [
    { key: 'fluency', label: 'Fluency', color: '#6C5CE7' },
    { key: 'vocabulary', label: 'Vocabulary', color: '#00CEC9' },
    { key: 'grammar', label: 'Grammar', color: '#0984E3' },
    { key: 'pronunciation', label: 'Pronunciation', color: '#E17055' },
    { key: 'coherence', label: 'Coherence', color: '#00B894' },
  ];

  return (
    <div className="space-y-3">
      {dims.map(({ key, label, color }) => {
        const val = scores[key] || 0;
        return (
          <div key={key}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-medium text-text-secondary">{label}</span>
              <span className="text-xs font-bold" style={{ color }}>{val.toFixed(1)}</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${(val / 9) * 100}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Result Page ---------- */
export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, question, responses, isFollowUpSession } = location.state || {};

  if (!result) {
    return (
      <div className="px-4 pt-12 text-center">
        <p className="text-text-secondary">No evaluation data available.</p>
        <Link to="/" className="text-primary text-sm mt-4 inline-block">Go Home</Link>
      </div>
    );
  }

  const scores = result.scores || {};
  const overall = scores.overall || 0;

  return (
    <div className="px-4 pt-4 pb-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-1">
          <ArrowLeft size={22} className="text-text" />
        </button>
        <h1 className="text-lg font-bold">Evaluation Result</h1>
      </div>

      {/* Question & Conversation */}
      {question && (
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-2 mb-1.5">
            <PartBadge part={question.part} />
            <span className="text-[11px] text-text-secondary">{question.topic}</span>
            {isFollowUpSession && responses?.length > 0 && (
              <span className="ml-auto text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                <MessageCircle size={10} />
                {responses.length} questions
              </span>
            )}
          </div>
          <p className="text-sm text-text">{question.text}</p>
        </div>
      )}

      {/* Overall Score */}
      <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-center text-white shadow-lg">
        <p className="text-white/70 text-sm mb-2">Overall Band Score</p>
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-3xl font-bold">{overall.toFixed(1)}</span>
          </div>
        </div>
        <p className="text-white/60 text-xs mt-3">
          {overall >= 7 ? 'Excellent performance!' :
           overall >= 6 ? 'Good effort, keep improving!' :
           overall >= 5 ? 'Fair attempt, focus on weak areas.' :
           'Keep practicing to improve your score.'}
        </p>
      </div>

      {/* Score Breakdown */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Award size={16} className="text-primary" />
          Score Breakdown
        </h2>
        <ScoreChart scores={scores} />
      </div>

      {/* Conversation Q&A Pairs (follow-up sessions) */}
      {isFollowUpSession && responses?.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BookOpen size={16} className="text-primary" />
            Your Conversation
          </h2>
          <div className="space-y-3">
            {responses.map((r, i) => (
              <div key={i} className="bg-surface rounded-lg p-3">
                <p className="text-xs font-medium text-primary mb-1">
                  {i === 0 ? 'Q' : `Follow-up ${i}`}: {r.questionText}
                </p>
                <p className="text-sm text-text-secondary leading-relaxed">{r.transcript}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Single Transcript (non-follow-up sessions) */}
      {!isFollowUpSession && result.transcript && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <BookOpen size={16} className="text-primary" />
            Your Response
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">{result.transcript}</p>
        </div>
      )}

      {/* Feedback */}
      {result.feedback && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Lightbulb size={16} className="text-warning" />
            Examiner Feedback
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">{result.feedback}</p>
        </div>
      )}

      {/* Strengths & Areas to Improve */}
      {(result.strengths?.length > 0 || result.areas_to_improve?.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {result.strengths?.length > 0 && (
            <div className="bg-success/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-success mb-2">Strengths</p>
              {result.strengths.map((s, i) => (
                <p key={i} className="text-xs text-text-secondary leading-relaxed">+ {s}</p>
              ))}
            </div>
          )}
          {result.areas_to_improve?.length > 0 && (
            <div className="bg-danger/10 rounded-xl p-4">
              <p className="text-xs font-semibold text-danger mb-2">To Improve</p>
              {result.areas_to_improve.map((a, i) => (
                <p key={i} className="text-xs text-text-secondary leading-relaxed">- {a}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Phrase Improvements */}
      {result.phrase_improvements?.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold mb-3">Expression Upgrades</h2>
          <div className="space-y-3">
            {result.phrase_improvements.map((item, i) => (
              <div key={i} className="bg-surface rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs mb-1">
                  <span className="text-danger line-through">{item.original}</span>
                  <ArrowRight size={12} className="text-gray-400 shrink-0" />
                  <span className="text-success font-semibold">{item.improved}</span>
                </div>
                {item.explanation && (
                  <p className="text-[11px] text-text-secondary">{item.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sample Answer */}
      {result.sample_answer && (
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
          <h2 className="text-sm font-semibold text-primary mb-3">Band 8-9 Sample Answer</h2>
          {isFollowUpSession && result.sample_answer.includes('Q:') ? (
            <div className="space-y-3">
              {result.sample_answer.split(/\n\nQ:/).map((block, i) => {
                const text = i === 0 ? block : 'Q:' + block;
                const qMatch = text.match(/^Q:\s*(.+)/);
                const aMatch = text.match(/\nA:\s*([\s\S]+)/);
                if (!qMatch || !aMatch) return (
                  <p key={i} className="text-sm text-text-secondary leading-relaxed">{text.trim()}</p>
                );
                return (
                  <div key={i} className="bg-white/60 rounded-lg p-3">
                    <p className="text-xs font-medium text-primary mb-1">{qMatch[1].trim()}</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{aMatch[1].trim()}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-text-secondary leading-relaxed">{result.sample_answer}</p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={() => navigate(`/practice/${question?.id || ''}`)}
          className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 text-text py-3 rounded-xl text-sm font-medium"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
        <button
          onClick={() => navigate('/questions')}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl text-sm font-semibold"
        >
          Next Question
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
