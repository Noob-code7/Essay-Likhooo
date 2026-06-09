import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyJWT } from '@/lib/auth-helpers';
import { supabase } from '@/lib/db';
import { BookOpen, FileText, Play, LogOut, User } from 'lucide-react';

export default async function StudentDashboardPage() {
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

  // Fetch active exam from database
  const { data: exam } = await supabase
    .from('exams')
    .select('*')
    .limit(1)
    .single();

  if (exam) {
    // If student has already submitted, redirect to success page
    const { data: submission } = await supabase
      .from('submissions')
      .select('status')
      .eq('student_id', payload.id)
      .eq('exam_id', exam.id)
      .single();

    if (submission && submission.status !== 'draft') {
      redirect('/submit-success');
    }
  }

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
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 font-heading">Student Dashboard</h1>
            <p className="mt-2 text-sm text-slate-600">Welcome back. Please review the examination details below before starting.</p>
          </div>

          {!exam ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-4 text-lg font-bold text-slate-900 font-heading">No Exam Assigned</h3>
              <p className="mt-2 text-sm text-slate-500">
                You do not currently have any scheduled essay exams. Contact your administrator if this is a mistake.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-sm space-y-6">
              <div>
                <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                  Active Examination
                </span>
                <h2 className="mt-3 text-2xl font-bold text-slate-900 font-heading">
                  {exam.title}
                </h2>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Essay Topic</h3>
                <p className="mt-2 text-slate-700 leading-relaxed font-medium">
                  {exam.topic}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Instructions</h3>
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-600 space-y-1">
                  <li>Your response must be written in English.</li>
                  <li>Minimum word count requirement is <strong>100 words</strong>.</li>
                  <li>Maximum word limit is <strong>2000 words</strong>.</li>
                  <li>Your work will be automatically saved every 30 seconds.</li>
                  <li>Once submitted, your response is locked and cannot be edited.</li>
                </ul>
              </div>

              <div className="border-t border-slate-100 pt-6 flex justify-end">
                <a
                  href="/write"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Start Writing
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
