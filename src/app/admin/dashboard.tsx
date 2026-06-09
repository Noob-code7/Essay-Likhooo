'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Award, 
  Download, 
  LogOut, 
  Eye, 
  RefreshCcw, 
  FileText, 
  BookOpen, 
  Sparkles,
  Loader2,
  X
} from 'lucide-react';

interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  essayText: string;
  wordCount: number;
  submittedAt: string;
  status: 'draft' | 'pending' | 'evaluating' | 'completed' | 'failed';
  retryCount: number;
  scores: {
    grammarScore: number;
    accuracyScore: number;
    qualityScore: number;
    overallScore: number;
    feedback: string;
    modelVersion: string;
    evaluatedAt: string;
  } | null;
}

interface Metrics {
  totalStudents: number;
  totalSubmissions: number;
  pendingCount: number;
  completedCount: number;
  failedCount: number;
  avgScore: number;
}

interface Exam {
  id: string;
  title: string;
  topic: string;
}

interface AdminDashboardProps {
  metrics: Metrics;
  submissions: Submission[];
  exam: Exam | null;
}

export default function AdminDashboard({ metrics, submissions, exam }: AdminDashboardProps) {
  const router = useRouter();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [reevaluatingId, setReevaluatingId] = useState<string | null>(null);

  // Trigger manual evaluation retry
  const handleReevaluate = async (submissionId: string) => {
    if (reevaluatingId) return;
    setReevaluatingId(submissionId);
    try {
      const res = await fetch('/api/admin/re-evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ submissionId }),
      });

      if (res.ok) {
        // If modal was open and re-evaluation is triggered, close it
        if (selectedSubmission?.id === submissionId) {
          setSelectedSubmission(null);
        }
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to trigger re-evaluation');
      }
    } catch (e) {
      alert('An unexpected error occurred.');
    } finally {
      setReevaluatingId(null);
    }
  };

  const getStatusBadge = (status: Submission['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-bold text-green-700 border border-green-100">
            <CheckCircle2 className="h-3 w-3" />
            Evaluated
          </span>
        );
      case 'pending':
      case 'evaluating':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-1 text-xs font-bold text-yellow-700 border border-yellow-100">
            <Clock className="h-3 w-3 animate-pulse" />
            {status === 'evaluating' ? 'Evaluating...' : 'Queued'}
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-bold text-red-700 border border-red-100">
            <AlertCircle className="h-3 w-3" />
            Failed
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 border border-slate-200">
            <FileText className="h-3 w-3" />
            Draft
          </span>
        );
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-US', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading font-bold text-slate-900 tracking-tight">AI Essay Examination - Admin Portal</span>
            </div>

            <div className="flex items-center gap-4">
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading">Dashboard Overview</h1>
            <p className="text-sm text-slate-500">Monitor student grades, exam status, and run evaluations.</p>
          </div>
          
          <a
            href="/api/admin/export-csv"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition-all cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Export Results (CSV)
          </a>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Card 1: Total Students */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Students</span>
              <Users className="h-4 w-4" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 leading-none">{metrics.totalStudents}</p>
          </div>

          {/* Card 2: Total Submissions */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Submissions</span>
              <FileText className="h-4 w-4" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 leading-none">{metrics.totalSubmissions}</p>
          </div>

          {/* Card 3: Pending */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending</span>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 leading-none">{metrics.pendingCount}</p>
          </div>

          {/* Card 4: Evaluated */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Evaluated</span>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 leading-none">{metrics.completedCount}</p>
          </div>

          {/* Card 5: Failed */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Failed</span>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 leading-none">{metrics.failedCount}</p>
          </div>

          {/* Card 6: Average Score */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-semibold uppercase tracking-wider">Avg Score</span>
              <Award className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 leading-none">
              {metrics.avgScore} <span className="text-xs font-normal text-slate-400">/100</span>
            </p>
          </div>
        </div>

        {/* Exam Subject Card (Short Reference) */}
        {exam && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xs flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Exam Subject</span>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">{exam.title}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl line-clamp-1">{exam.topic}</p>
            </div>
          </div>
        )}

        {/* Submissions Table */}
        <div className="rounded-2xl border border-slate-100 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-semibold text-xs tracking-wider uppercase">
                  <th className="px-6 py-4">Student ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Word Count</th>
                  <th className="px-6 py-4">Submitted At</th>
                  <th className="px-6 py-4">Overall Score</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      No essay submissions recorded in the database.
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{sub.studentId}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{sub.studentName}</td>
                      <td className="px-6 py-4">{getStatusBadge(sub.status)}</td>
                      <td className="px-6 py-4 text-slate-500">{sub.wordCount} words</td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(sub.submittedAt)}</td>
                      <td className="px-6 py-4">
                        {sub.status === 'completed' && sub.scores ? (
                          <span className="font-extrabold text-slate-900">{sub.scores.overallScore}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedSubmission(sub)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                          
                          {(sub.status === 'completed' || sub.status === 'failed') && (
                            <button
                              onClick={() => handleReevaluate(sub.id)}
                              disabled={reevaluatingId !== null}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all cursor-pointer disabled:opacity-50"
                            >
                              {reevaluatingId === sub.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <RefreshCcw className="h-3.5 w-3.5" />
                              )}
                              Re-evaluate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* View Essay Details Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-100 bg-white shadow-2xl animate-in fade-in-50 zoom-in-95 duration-200 flex flex-col my-8 max-h-[85vh]">
            {/* Modal Header */}
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Essay Examination Review
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Student: {selectedSubmission.studentName} ({selectedSubmission.studentId})
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Scoring Breakdown (If complete) */}
              {selectedSubmission.status === 'completed' && selectedSubmission.scores && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Grammar</span>
                    <p className="text-lg font-bold text-slate-800">{selectedSubmission.scores.grammarScore} <span className="text-xs font-normal text-slate-400">/30</span></p>
                  </div>
                  <div className="text-center space-y-1 border-l border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Accuracy</span>
                    <p className="text-lg font-bold text-slate-800">{selectedSubmission.scores.accuracyScore} <span className="text-xs font-normal text-slate-400">/30</span></p>
                  </div>
                  <div className="text-center space-y-1 border-l border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Quality</span>
                    <p className="text-lg font-bold text-slate-800">{selectedSubmission.scores.qualityScore} <span className="text-xs font-normal text-slate-400">/30</span></p>
                  </div>
                  <div className="text-center space-y-1 border-l border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Overall</span>
                    <p className="text-lg font-extrabold text-blue-600">{selectedSubmission.scores.overallScore} <span className="text-xs font-normal text-slate-400">/100</span></p>
                  </div>
                </div>
              )}

              {/* Essay Text */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submitted Essay Response</h4>
                <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-100 text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedSubmission.essayText}
                </div>
              </div>

              {/* AI Feedback Comments */}
              {selectedSubmission.status === 'completed' && selectedSubmission.scores && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <Sparkles className="h-4 w-4 text-blue-500 fill-current" />
                    <span>AI Evaluation Feedback</span>
                  </div>
                  <div className="bg-blue-50/20 p-5 rounded-xl border border-blue-100/50 text-sm text-slate-700 leading-relaxed max-h-40 overflow-y-auto">
                    {selectedSubmission.scores.feedback}
                  </div>
                  <p className="text-[10px] text-slate-400 text-right">
                    Model: {selectedSubmission.scores.modelVersion} | Evaluated: {formatDate(selectedSubmission.scores.evaluatedAt)}
                  </p>
                </div>
              )}

              {selectedSubmission.status === 'failed' && (
                <div className="rounded-xl bg-red-50 p-4 border border-red-100 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>The background AI evaluation failed after 3 retry attempts. You can trigger a manual retry using the Re-evaluate button.</span>
                </div>
              )}

              {(selectedSubmission.status === 'pending' || selectedSubmission.status === 'evaluating') && (
                <div className="rounded-xl bg-yellow-50 p-4 border border-yellow-100 text-sm text-yellow-700 flex items-center gap-2">
                  <Clock className="h-5 w-5 shrink-0 animate-pulse" />
                  <span>This essay is currently queued and waiting for grading. The background worker is running.</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 px-6 py-4 flex justify-between bg-slate-50/50 rounded-b-2xl">
              <div>
                {(selectedSubmission.status === 'completed' || selectedSubmission.status === 'failed') && (
                  <button
                    onClick={() => handleReevaluate(selectedSubmission.id)}
                    disabled={reevaluatingId !== null}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {reevaluatingId === selectedSubmission.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-3.5 w-3.5" />
                    )}
                    Re-evaluate Essay
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
