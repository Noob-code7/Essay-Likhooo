import { supabase } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Starting database seeding...');

  try {
    const passwordHash = await bcrypt.hash('student123', 10);

    // Seed Students
    const testStudents = [
      { student_id: 'STU001', name: 'John Doe', password_hash: passwordHash },
      { student_id: 'STU002', name: 'Jane Smith', password_hash: passwordHash },
      { student_id: 'STU003', name: 'Alex Johnson', password_hash: passwordHash }
    ];

    console.log('Seeding students...');
    for (const student of testStudents) {
      // Check if student already exists
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('student_id', student.student_id)
        .single();

      if (!existing) {
        const { data, error } = await supabase.from('students').insert(student);
        if (error) console.error(`Failed to insert student ${student.student_id}:`, error.message);
        else console.log(`Seeded student: ${student.student_id}`);
      } else {
        console.log(`Student ${student.student_id} already exists, skipping.`);
      }
    }

    // Seed Exams
    console.log('Seeding exams...');
    const examData = {
      title: 'English Composition Final Exam',
      topic: 'The Impact of Artificial Intelligence on Modern Education. Discuss the pros and cons of AI in classrooms, and how it shapes the future of learning.',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 60 * 60 * 24 * 1000).toISOString() // 24 hours from now
    };

    const { data: existingExams } = await supabase
      .from('exams')
      .select('id');

    if (!existingExams || existingExams.length === 0) {
      const { error } = await supabase.from('exams').insert(examData);
      if (error) console.error('Failed to insert exam:', error.message);
      else console.log('Seeded exam topic.');
    } else {
      console.log('Exams already exist, skipping.');
    }

    console.log('Seeding complete successfully.');
  } catch (err) {
    console.error('Seeding error:', err);
  }
}

seed();
