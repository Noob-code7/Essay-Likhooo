import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyJWT } from '@/lib/auth-helpers';
import { supabase } from '@/lib/db';
import { 
  BookOpen, 
  User, 
  LogOut, 
  CheckCircle2, 
  Calendar, 
  FileText, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Award, 
  Sparkles 
} from 'lucide-react';
import RefreshButton from './refresh-button';

export default async function SubmitSuccessPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session');

  if (!sessionCookie) {
    redirect('/login');
  }

  const payload = (await verifyJWT(sessionCookie.value)) as any;
  if (!payload) {
    redirect('/login');
  }

  if (payload.role === 'admin') {
    redirect('/admin');
  }

  // Fetch active exam
  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .limit(1)
    .single();

  if (!exam) {
    redirect('/');
  }

  // Fetch submission
  const { data: submission } = await supabase
    .from('submissions')
    .select('*')
    .eq('student_id', payload.id)
    .eq('exam_id', exam.id)
    .single();

  // Redirect back if no submission, or if it is still a draft
  if (!submission || submission.status === 'draft') {
    redirect('/');
  }

  // Fetch AI scores if completed
  let aiScore = null;
  if (submission.status === 'completed') {
    const { data } = await supabase
      .from('ai_scores')
      .select('*')
      .eq('submission_id', submission.id)
      .single();
    aiScore = data;
  }

  const formattedDate = submission.submitted_at 
    ? new Date(submission.submitted_at).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'N/A';

  // Determine header icon, title, and description based on status
  const getHeaderDetails = () => {
    switch (submission.status) {
      case 'completed':
        return {
          icon: (
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 border border-blue-100 text-blue-600">
              <Award className="h-10 w-10" />
            </div>
          ),
          title: 'Evaluation Completed',
          description: 'Your essay has been evaluated. Below are your grades and constructive feedback.'
        };
      case 'failed':
        return {
          icon: (
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-50 border border-green-100 text-green-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
          ),
          title: 'Thank You for Participating!',
          description: 'Your essay has been received and saved successfully. Results will be declared by the administrator after evaluation.'
        };
      case 'evaluating':
        return {
          icon: (
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-yellow-50 border border-yellow-100 text-yellow-600">
              <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
            </div>
          ),
          title: 'Evaluating Essay...',
          description: 'Your essay is currently being graded by the AI. This should only take a few seconds.'
        };
      case 'pending':
      default:
        return {
          icon: (
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-50 border border-green-100 text-green-600">
              <CheckCircle2 className="h-10 w-10" />
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-10"></span>
            </div>
          ),
          title: 'Submission Successful',
          description: 'Your essay has been successfully recorded in our secure database. An automated evaluation is running in the background.'
        };
    }
  };

  const headerDetails = getHeaderDetails();

  const getStatusBadge = () => {
    switch (submission.status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3.5 py-1.5 text-xs font-bold text-green-700 border border-green-100/50 shadow-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            Evaluated
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 border border-blue-100/50 shadow-xs">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
            Submitted
          </span>
        );
      case 'evaluating':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-3.5 py-1.5 text-xs font-bold text-yellow-700 border border-yellow-100/50 shadow-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-yellow-600" />
            Evaluating...
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 border border-blue-100/50 shadow-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
            Queued
          </span>
        );
    }
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
              <span className="font-heading font-bold text-slate-900 tracking-tight">AI Essay Examination</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <User className="h-4 w-4 text-slate-400" />
                <span className="font-semibold">{payload.name}</span>
                <span className="text-slate-400">({payload.extraId})</span>
              </div>
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
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 md:p-12 shadow-sm text-center space-y-8">
          {/* Status Icon */}
          <div className="flex justify-center">
            {headerDetails.icon}
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-slate-900 font-heading">
              {headerDetails.title}
            </h1>
            <p className="max-w-md mx-auto text-sm text-slate-500 leading-relaxed">
              {headerDetails.description}
            </p>
          </div>

          {/* Exam Details Card */}
          <div className="rounded-2xl bg-slate-50 border border-slate-100 p-6 text-left space-y-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Title</span>
              <p className="text-base font-bold text-slate-900 leading-snug">{exam.title}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200/60 pt-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Submitted At</span>
                <span className="inline-flex items-center gap-1.5 mt-1 text-sm font-semibold text-slate-700">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {formattedDate}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Word Count</span>
                <span className="inline-flex items-center gap-1.5 mt-1 text-sm font-semibold text-slate-700">
                  <FileText className="h-4 w-4 text-slate-400" />
                  {submission.word_count} words
                </span>
              </div>
            </div>

            <div className="border-t border-slate-200/60 pt-4 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Evaluation Status</span>
              <div className="flex items-center gap-3">
                {getStatusBadge()}
                <RefreshButton status={submission.status} />
              </div>
            </div>
          </div>

          {/* Dynamic Scoring Breakdown */}
          {submission.status === 'completed' && aiScore ? (
            <div className="space-y-6">
              {/* Overall Grade Card */}
              <div className="bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-md space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">Overall Grade</span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black font-heading">{aiScore.overall_score}</span>
                  <span className="text-lg text-blue-200">/ 100</span>
                </div>
                <p className="text-[10px] text-blue-200">Graded by {aiScore.model_version}</p>
              </div>

              {/* Score breakdown category columns */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grammar</span>
                  <span className="text-base font-extrabold text-slate-800">{aiScore.grammar_score}</span>
                  <span className="text-[10px] text-slate-400 block">/ 30</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Accuracy</span>
                  <span className="text-base font-extrabold text-slate-800">{aiScore.accuracy_score}</span>
                  <span className="text-[10px] text-slate-400 block">/ 30</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quality</span>
                  <span className="text-base font-extrabold text-slate-800">{aiScore.quality_score}</span>
                  <span className="text-[10px] text-slate-400 block">/ 30</span>
                </div>
              </div>

              {/* Constructive feedback block */}
              <div className="text-left space-y-2 border-t border-slate-100 pt-6">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Sparkles className="h-4 w-4 text-blue-500 fill-current" />
                  <span>AI Evaluation Feedback</span>
                </div>
                <div className="bg-blue-50/10 border border-blue-100/50 p-5 rounded-xl text-sm text-slate-700 leading-relaxed font-sans whitespace-pre-wrap">
                  {aiScore.feedback}
                </div>
              </div>
            </div>
          ) : submission.status === 'failed' ? (
            <div className="rounded-2xl bg-green-50 p-6 border border-green-100 text-center space-y-3">
              <div className="flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
              <h4 className="font-bold text-green-900 text-base">Your submission has been recorded!</h4>
              <p className="text-sm text-green-700 leading-relaxed max-w-sm mx-auto">
                Thank you for taking the test. Your results will be reviewed and declared by the administrator once the evaluation is complete.
              </p>
              <p className="text-xs text-green-600 font-medium">
                No further action is needed from your end.
              </p>
            </div>
          ) : null}

          {/* Action buttons */}
          <div className="flex justify-center border-t border-slate-100 pt-6">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                Back to Login
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
