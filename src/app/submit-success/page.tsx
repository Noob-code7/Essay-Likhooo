import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyJWT } from '@/lib/auth-helpers';
import { supabase } from '@/lib/db';
import { BookOpen, User, LogOut, CheckCircle2, Calendar, FileText, ArrowRight, Loader2 } from 'lucide-react';

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

  const formattedDate = submission.submitted_at 
    ? new Date(submission.submitted_at).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'N/A';

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
          {/* Animated Success Icon */}
          <div className="flex justify-center">
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-50 border border-green-100 text-green-600">
              <CheckCircle2 className="h-10 w-10" />
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-10"></span>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-slate-900 font-heading">
              Submission Successful
            </h1>
            <p className="max-w-md mx-auto text-sm text-slate-500 leading-relaxed">
              Your essay has been successfully recorded in our secure database. An automated evaluation is being run in the background.
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
              
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-bold text-blue-700 border border-blue-100/50 shadow-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
                Pending Evaluation
              </span>
            </div>
          </div>

          {/* Info banner */}
          <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-left bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">What happens next?</h3>
            <p className="mt-2 text-xs text-slate-500 leading-relaxed">
              The Google Gemini API model is analyzing your essay for grammar correctness, accuracy & relevance to the prompt topic, and writing quality. You do not need to keep this page open. You can check back on your student dashboard for feedback and score results once they are ready.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center border-t border-slate-100 pt-6">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
            >
              Back to Dashboard
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
