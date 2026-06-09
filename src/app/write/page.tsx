import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyJWT } from '@/lib/auth-helpers';
import { supabase } from '@/lib/db';
import { BookOpen, User, LogOut } from 'lucide-react';
import EssayEditor from './editor';

export default async function EssayWriterPage() {
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

  // If no exam active, redirect to student dashboard
  if (!exam) {
    redirect('/');
  }

  const student = {
    id: payload.id,
    name: payload.name,
    studentId: payload.extraId || 'N/A',
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
                <span className="font-semibold">{student.name}</span>
                <span className="text-slate-400">({student.studentId})</span>
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
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-heading">Essay Examination Workspace</h1>
            <p className="mt-1 text-sm text-slate-500">Your examination environment. Do not refresh this page once you start writing.</p>
          </div>

          <EssayEditor exam={exam} student={student} />
        </div>
      </main>
    </div>
  );
}
