'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Save, 
  AlertTriangle, 
  Loader2, 
  CheckCircle, 
  Send, 
  AlertCircle 
} from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  topic: string;
}

interface Student {
  id: string;
  name: string;
  studentId: string;
}

interface EssayEditorProps {
  exam: Exam;
  student: Student;
}

export default function EssayEditor({ exam, student }: EssayEditorProps) {
  const router = useRouter();
  const [essayText, setEssayText] = useState('');
  const [lastSavedText, setLastSavedText] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper: word count
  const countWords = (text: string) => {
    const trimmed = text.trim();
    return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
  };

  const wordCount = countWords(essayText);
  const charCount = essayText.length;
  const isWordCountValid = wordCount >= 100 && wordCount <= 2000;

  // Load active draft/submission status on mount
  useEffect(() => {
    async function loadActiveSubmission() {
      try {
        const res = await fetch('/api/submissions/active');
        if (res.ok) {
          const submission = await res.json();
          if (submission) {
            if (submission.status !== 'draft') {
              setIsLocked(true);
              router.replace('/submit-success');
            } else {
              setEssayText(submission.essay_text || '');
              setLastSavedText(submission.essay_text || '');
            }
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      } finally {
        setIsLoadingDraft(false);
      }
    }
    loadActiveSubmission();
  }, [router]);

  // Autosave function
  const saveDraft = async (textToSave: string) => {
    if (isLocked) return;
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/submissions/auto-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ essayText: textToSave }),
      });

      if (res.ok) {
        setLastSavedText(textToSave);
        setSaveStatus('saved');
        setLastSavedTime(new Date());
      } else {
        setSaveStatus('error');
      }
    } catch (e) {
      setSaveStatus('error');
    }
  };

  // Setup 30s autosave interval
  useEffect(() => {
    if (isLocked || isLoadingDraft) return;

    timerRef.current = setInterval(() => {
      if (essayText !== lastSavedText && essayText.trim() !== '') {
        saveDraft(essayText);
      }
    }, 30000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [essayText, lastSavedText, isLocked, isLoadingDraft]);

  // Manual save trigger (optional convenience)
  const handleManualSave = () => {
    if (essayText !== lastSavedText) {
      saveDraft(essayText);
    }
  };

  // Submit trigger
  const handleFinalSubmit = async () => {
    if (!isWordCountValid) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/submissions/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ essayText }),
      });

      if (res.ok) {
        setIsLocked(true);
        router.push('/submit-success');
      } else {
        const data = await res.json();
        alert(data.error || 'Submission failed. Please try again.');
      }
    } catch (e) {
      alert('An unexpected network error occurred.');
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  if (isLoadingDraft) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium">Loading examination workspace...</p>
        </div>
      </div>
    );
  }

  // Determine counter colors based on rules
  const getWordCountColor = () => {
    if (wordCount === 0) return 'text-slate-400';
    if (wordCount < 100) return 'text-red-600 font-semibold';
    if (wordCount > 2000) return 'text-red-600 font-semibold';
    if (wordCount > 1800) return 'text-orange-600 font-semibold';
    return 'text-green-600 font-semibold';
  };

  return (
    <div className="space-y-6">
      {/* Exam Header card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
        <div>
          <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
            Active Exam Topic
          </span>
          <h2 className="mt-2 text-xl font-bold text-slate-900 font-heading">
            {exam.title}
          </h2>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed font-medium bg-slate-50 p-4 rounded-xl border border-slate-100">
          {exam.topic}
        </p>
      </div>

      {/* Editor & Controls */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col">
        {/* Editor Toolbar / Status */}
        <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <FileText className="h-4 w-4 text-slate-400" />
            <span>Response Editor</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Status indicator */}
            <div className="flex items-center gap-1.5 text-xs">
              {saveStatus === 'saving' && (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  <span className="text-slate-500">Saving draft...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-slate-600">
                    Draft saved {lastSavedTime ? `at ${lastSavedTime.toLocaleTimeString()}` : ''}
                  </span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertCircle className="h-3.5 w-3.5 text-red-600 animate-pulse" />
                  <span className="text-red-600 font-semibold">Connection lost. Retrying save...</span>
                </>
              )}
              {saveStatus === 'idle' && lastSavedTime && (
                <span className="text-slate-400">
                  Last saved at {lastSavedTime.toLocaleTimeString()}
                </span>
              )}
            </div>

            {/* Manual Save Button */}
            <button
              onClick={handleManualSave}
              disabled={essayText === lastSavedText || isLocked}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:hover:bg-white cursor-pointer"
            >
              <Save className="h-3 w-3" />
              Save Now
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            disabled={isLocked || isSubmitting}
            placeholder="Write your essay response here. Make sure it addresses the prompt directly and contains between 100 and 2000 words..."
            rows={18}
            className="w-full resize-y border-0 bg-transparent px-6 py-5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 leading-relaxed font-sans"
            style={{ minHeight: '350px' }}
          />
        </div>

        {/* Editor Footer (Counters & Submit) */}
        <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50 flex-wrap gap-4">
          <div className="flex gap-6 items-center flex-wrap">
            {/* Word Count */}
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Word Count</span>
              <span className={`text-sm ${getWordCountColor()}`}>
                {wordCount} <span className="text-xs text-slate-500 font-normal">/ 100 - 2000</span>
              </span>
            </div>

            {/* Character Count */}
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Characters</span>
              <span className="text-sm font-semibold text-slate-700">
                {charCount}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Validation warning feedback */}
            {wordCount > 0 && wordCount < 100 && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 border border-red-100">
                <AlertTriangle className="h-3.5 w-3.5" />
                Min 100 words required (current: {wordCount})
              </span>
            )}
            {wordCount > 2000 && (
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 border border-red-100">
                <AlertTriangle className="h-3.5 w-3.5" />
                Max 2000 words limit exceeded (current: {wordCount})
              </span>
            )}

            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={!isWordCountValid || isLocked || isSubmitting}
              className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer ${
                isWordCountValid && !isLocked && !isSubmitting
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <Send className="h-3.5 w-3.5" />
              Submit Essay
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-xl space-y-6 animate-in fade-in-50 zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 border border-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  Submit Examination?
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  You are about to submit your essay for evaluation. This will lock your text area and you will not be able to make any further changes. Do you wish to proceed?
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Exam
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
