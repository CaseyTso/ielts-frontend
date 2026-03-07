import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Square, Send, Clock, RotateCcw, Loader2, AlertTriangle, ChevronRight } from 'lucide-react';
import { api, loadConfig } from '../api';
import { useAudioRecorder } from '../useAudioRecorder';
import { PartBadge, LoadingSpinner } from '../components/UIComponents';

/* ---------- Countdown Timer Component ---------- */
function CountdownTimer({ seconds, onFinish }) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      onFinish?.();
      return;
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onFinish]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = (remaining / seconds) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#E9ECEF" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="45" fill="none"
            stroke={remaining <= 10 ? '#FF6B6B' : '#6C5CE7'}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - pct / 100)}`}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${remaining <= 10 ? 'text-danger' : 'text-primary'}`}>
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Recording Duration Display ---------- */
function RecordingDuration({ seconds }) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return (
    <span className="font-mono text-sm text-text-secondary">
      {mins}:{secs.toString().padStart(2, '0')}
    </span>
  );
}

/* ---------- Practice Page ---------- */
export default function PracticePage() {
  const { questionId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('ready'); // ready | prep | recording | submitting
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const { isRecording, audioBlob, duration, startRecording, stopRecording, resetRecording } = useAudioRecorder();

  // Follow-up question flow state
  const [questionSequence, setQuestionSequence] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState([]);

  const hasFollowUps = questionSequence.length > 1;
  const isLastQuestion = currentIndex >= questionSequence.length - 1;

  // Load question and build sequence
  useEffect(() => {
    api.getQuestions().then((data) => {
      const q = data.questions.find((q) => q.id === questionId);
      if (q) {
        setQuestion(q);
        const seq = [q.text];
        if (q.part !== 2 && q.follow_ups?.length > 0) {
          seq.push(...q.follow_ups);
        }
        setQuestionSequence(seq);
        setCurrentIndex(0);
        setResponses([]);
      } else {
        setError('Question not found');
      }
    }).catch(() => setError('Failed to load question'))
    .finally(() => setLoading(false));
  }, [questionId]);

  // Handle recording start
  const handleStartRecording = useCallback(async () => {
    try {
      setError('');
      await startRecording();
      setPhase('recording');
    } catch (err) {
      setError(err.message);
    }
  }, [startRecording]);

  // Handle recording stop
  const handleStopRecording = useCallback(() => {
    stopRecording();
    setPhase('ready');
  }, [stopRecording]);

  // Submit current answer
  const handleSubmit = useCallback(async () => {
    if (!audioBlob && !transcript) return;

    setPhase('submitting');
    setError('');

    try {
      let currentTranscript = transcript;

      // If audio was recorded, transcribe it first
      if (audioBlob) {
        const transcribeResult = await api.transcribe(audioBlob);
        if (transcribeResult.error) {
          setError(transcribeResult.error);
          setPhase('ready');
          return;
        }
        currentTranscript = transcribeResult.transcript;
        if (!currentTranscript) {
          setError('Could not transcribe audio. The recording may be too short or silent.');
          setPhase('ready');
          return;
        }
      }

      // Store the response
      const newResponses = [...responses, {
        questionText: questionSequence[currentIndex],
        transcript: currentTranscript,
      }];
      setResponses(newResponses);

      const nextIndex = currentIndex + 1;

      if (nextIndex < questionSequence.length) {
        // More questions: advance to next
        setCurrentIndex(nextIndex);
        setTranscript('');
        resetRecording();
        setPhase('ready');
      } else {
        // All done: build combined transcript and evaluate
        const combinedTranscript = newResponses
          .map(r => `Q: ${r.questionText}\nA: ${r.transcript}`)
          .join('\n\n');

        const result = await api.evaluate({
          question_id: question.id,
          question_text: question.text,
          part: question.part,
          transcript: combinedTranscript,
        });

        navigate('/result', {
          state: {
            result,
            question,
            responses: newResponses,
            isFollowUpSession: questionSequence.length > 1,
          },
        });
      }
    } catch (err) {
      setError(err.message || 'Evaluation failed');
      setPhase('ready');
    }
  }, [audioBlob, transcript, question, navigate, responses, questionSequence, currentIndex, resetRecording]);

  // Start prep timer for Part 2
  const handleStartPrep = () => setPhase('prep');
  const handlePrepFinish = () => setPhase('ready');

  // Back button with confirmation if mid-sequence
  const handleBack = () => {
    if (responses.length > 0) {
      if (window.confirm('You have answered some questions. Leave and lose your progress?')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error && !question) {
    return (
      <div className="px-4 pt-6">
        <p className="text-danger text-center">{error}</p>
        <button onClick={() => navigate('/questions')} className="mt-4 text-primary text-sm mx-auto block">
          Back to Questions
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh]">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
        <button onClick={handleBack} className="p-1">
          <ArrowLeft size={22} className="text-text" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <PartBadge part={question.part} />
            <span className="text-xs text-text-secondary">{question.topic}</span>
          </div>
        </div>
      </div>

      {/* Question Display */}
      <div className="px-5 pt-6 pb-4">
        {/* Progress indicator for follow-up flow */}
        {hasFollowUps && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-text-secondary">
              Question {currentIndex + 1} of {questionSequence.length}
            </span>
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questionSequence.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Current question text */}
        <p className="text-lg font-semibold text-text leading-relaxed">
          {questionSequence[currentIndex] || question.text}
        </p>

        {/* Follow-up label */}
        {currentIndex > 0 && (
          <span className="inline-block mt-2 text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">
            Follow-up question
          </span>
        )}

        {/* Part 2: Cue Card */}
        {question.part === 2 && question.cue_card_points?.length > 0 && (
          <div className="mt-4 bg-white rounded-xl p-4 border border-gray-200">
            <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wider">Cue Card</p>
            {question.cue_card_points.map((point, i) => (
              <p key={i} className="text-sm text-text-secondary leading-relaxed">{point}</p>
            ))}
          </div>
        )}
      </div>

      {/* Previous responses summary */}
      {responses.length > 0 && (
        <div className="mx-5 mb-3 space-y-2">
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Previous responses</p>
          {responses.map((r, i) => (
            <div key={i} className="bg-white/60 rounded-lg p-3 border border-gray-100">
              <p className="text-xs text-text-secondary font-medium">{r.questionText}</p>
              <p className="text-xs text-text mt-1 line-clamp-2">{r.transcript}</p>
            </div>
          ))}
        </div>
      )}

      {/* Prep Timer for Part 2 */}
      {question.part === 2 && phase === 'ready' && !audioBlob && (
        <div className="px-5 py-4 flex justify-center">
          <button
            onClick={handleStartPrep}
            className="flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-xl text-sm font-semibold"
          >
            <Clock size={18} />
            Start 1-min Preparation
          </button>
        </div>
      )}

      {phase === 'prep' && (
        <div className="flex flex-col items-center py-6 gap-4">
          <p className="text-sm font-medium text-text-secondary">Preparation Time</p>
          <CountdownTimer seconds={60} onFinish={handlePrepFinish} />
          <p className="text-xs text-text-secondary">Make notes and organize your thoughts</p>
          <button
            onClick={handlePrepFinish}
            className="text-primary text-sm font-medium"
          >
            Skip & Start Recording
          </button>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Error */}
      {error && (
        <div className="mx-5 mb-3 bg-danger/10 text-danger text-sm p-3 rounded-xl flex items-start gap-2">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-xs mt-0.5">{error}</p>
            {!loadConfig().apiKey && (
              <p className="text-xs mt-1 text-text-secondary">
                Tip: Make sure your API key is configured in Settings.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Transcript Display (after recording, before submit) */}
      {transcript && phase !== 'submitting' && (
        <div className="mx-5 mb-3 bg-white rounded-xl p-4 border border-gray-200 max-h-32 overflow-y-auto">
          <p className="text-xs font-semibold text-text-secondary mb-1">Your response:</p>
          <p className="text-sm text-text leading-relaxed">{transcript}</p>
        </div>
      )}

      {/* Manual Transcript Input (fallback) */}
      {!audioBlob && phase === 'ready' && !isRecording && (
        <div className="mx-5 mb-3">
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Or type your response here if microphone is unavailable..."
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

      {/* Controls */}
      <div className="px-5 pb-8 pt-3 bg-white border-t border-gray-100">
        {phase === 'submitting' ? (
          <div className="flex flex-col items-center py-4 gap-2">
            <Loader2 size={32} className="text-primary animate-spin" />
            <p className="text-sm text-text-secondary">
              {isLastQuestion ? 'Analyzing your responses...' : 'Processing...'}
            </p>
          </div>
        ) : isRecording ? (
          <div className="flex flex-col items-center gap-4">
            <RecordingDuration seconds={duration} />
            <button
              onClick={handleStopRecording}
              className="relative w-16 h-16 bg-danger rounded-full flex items-center justify-center shadow-lg recording-pulse"
            >
              <Square size={24} className="text-white" fill="white" />
            </button>
            <p className="text-xs text-text-secondary">Tap to stop recording</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Record Button */}
            {phase !== 'prep' && (
              <button
                onClick={handleStartRecording}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3.5 rounded-xl font-semibold text-sm shadow-md active:scale-[0.98] transition-transform"
              >
                <Mic size={20} />
                {audioBlob ? 'Re-record' : 'Start Recording'}
              </button>
            )}

            {/* Submit / Next Button */}
            {(audioBlob || transcript.trim()) && (
              <button
                onClick={handleSubmit}
                className="flex items-center justify-center gap-2 bg-success text-white px-6 py-3.5 rounded-xl font-semibold text-sm shadow-md active:scale-[0.98] transition-transform"
              >
                {isLastQuestion ? (
                  <>
                    <Send size={18} />
                    Submit
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            )}

            {/* Reset */}
            {audioBlob && (
              <button
                onClick={() => { resetRecording(); setTranscript(''); }}
                className="p-3 bg-gray-100 rounded-xl"
              >
                <RotateCcw size={20} className="text-text-secondary" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
