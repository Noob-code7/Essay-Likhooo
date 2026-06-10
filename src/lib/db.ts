import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { loadEnvConfig } from '@next/env';

// Load environment variables for scripts/tests running outside Next.js
loadEnvConfig(process.cwd());

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-role-key';

export const isMockDb = !supabaseUrl || supabaseUrl.includes('dummy-url');

// Real Supabase Client
const realSupabase = !isMockDb 
  ? createClient(supabaseUrl, supabaseServiceKey) // Use service role key for full server-side bypass
  : null;

// Mock Database File Location
const MOCK_DB_PATH = path.join(process.cwd(), '.planning', 'mock_database.json');

// Initialize Mock JSON Database
function loadMockData() {
  if (!fs.existsSync(MOCK_DB_PATH)) {
    const initialData = {
      students: [],
      exams: [],
      submissions: [],
      ai_scores: []
    };
    fs.mkdirSync(path.dirname(MOCK_DB_PATH), { recursive: true });
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(initialData, null, 2));
    return initialData;
  }
  try {
    return JSON.parse(fs.readFileSync(MOCK_DB_PATH, 'utf-8'));
  } catch (e) {
    return { students: [], exams: [], submissions: [], ai_scores: [] };
  }
}

function saveMockData(data: any) {
  fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(data, null, 2));
}

// Mock Supabase Query builder matching Supabase syntax subset
class MockQueryBuilder {
  private tableName: string;
  private filters: { col: string; val: any }[] = [];
  private limitCount?: number;
  private operation: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private updateValues: any = null;
  private insertRows: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*') {
    this.operation = 'select';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ col: column, val: value });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  async single() {
    const res = await this.execute();
    const list = res.data || [];
    if (list.length === 0) {
      return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
    }
    return { data: list[0], error: null };
  }

  insert(rows: any | any[]) {
    this.operation = 'insert';
    this.insertRows = rows;
    return this;
  }

  update(values: any) {
    this.operation = 'update';
    this.updateValues = values;
    return this;
  }

  delete() {
    this.operation = 'delete';
    return this;
  }

  private async execute() {
    const data = loadMockData();
    const list = data[this.tableName] || [];

    if (this.operation === 'select') {
      const filtered = list.filter((item: any) => {
        return this.filters.every(f => String(item[f.col]) === String(f.val));
      });
      const limited = this.limitCount !== undefined ? filtered.slice(0, this.limitCount) : filtered;
      return { data: limited, error: null };
    }

    if (this.operation === 'insert') {
      if (!data[this.tableName]) data[this.tableName] = [];
      const newRows = Array.isArray(this.insertRows) ? this.insertRows : [this.insertRows];
      const createdRows = newRows.map((row: any) => {
        const item = {
          id: row.id || crypto.randomUUID(),
          created_at: new Date().toISOString(),
          ...row
        };

        // Trigger logic for submissions
        if (this.tableName === 'submissions') {
          const student = data.students?.find((s: any) => String(s.id) === String(item.student_id));
          if (student) {
            item.roll_number = student.student_id;
            item.student_name = student.name;
          }
        }

        // Trigger logic for ai_scores
        if (this.tableName === 'ai_scores') {
          const sub = data.submissions?.find((s: any) => String(s.id) === String(item.submission_id));
          if (sub) {
            item.roll_number = sub.roll_number;
            item.student_name = sub.student_name;
          }
        }

        return item;
      });
      data[this.tableName].push(...createdRows);
      saveMockData(data);
      return { data: Array.isArray(this.insertRows) ? createdRows : createdRows[0], error: null };
    }

    if (this.operation === 'update') {
      let updatedCount = 0;
      let updatedData: any = null;
      const updatedList = list.map((item: any) => {
        const match = this.filters.every(f => String(item[f.col]) === String(f.val));
        if (match) {
          updatedCount++;
          // Trigger logic when updating student's name
          if (this.tableName === 'students' && this.updateValues.name && item.name !== this.updateValues.name) {
            const newName = this.updateValues.name;
            // Update submissions
            if (data.submissions) {
              data.submissions = data.submissions.map((sub: any) => {
                if (String(sub.student_id) === String(item.id)) {
                  return { ...sub, student_name: newName };
                }
                return sub;
              });
            }
            // Update ai_scores
            if (data.ai_scores) {
              data.ai_scores = data.ai_scores.map((score: any) => {
                const sub = data.submissions?.find((s: any) => String(s.id) === String(score.submission_id));
                if (sub && String(sub.student_id) === String(item.id)) {
                  return { ...score, student_name: newName };
                }
                return score;
              });
            }
          }

          // Trigger logic for submissions updates (e.g. changing student_id or other fields)
          if (this.tableName === 'submissions') {
            const currentStudentId = this.updateValues.student_id || item.student_id;
            const student = data.students?.find((s: any) => String(s.id) === String(currentStudentId));
            if (student) {
              item.roll_number = student.student_id;
              item.student_name = student.name;
            }
          }

          // Trigger logic for ai_scores updates (e.g. changing submission_id)
          if (this.tableName === 'ai_scores') {
            const currentSubId = this.updateValues.submission_id || item.submission_id;
            const sub = data.submissions?.find((s: any) => String(s.id) === String(currentSubId));
            if (sub) {
              item.roll_number = sub.roll_number;
              item.student_name = sub.student_name;
            }
          }

          updatedData = { ...item, ...this.updateValues, updated_at: new Date().toISOString() };
          return updatedData;
        }
        return item;
      });
      data[this.tableName] = updatedList;
      saveMockData(data);
      return { data: updatedData, error: null, count: updatedCount };
    }

    if (this.operation === 'delete') {
      const remaining = list.filter((item: any) => {
        return !this.filters.every(f => String(item[f.col]) === String(f.val));
      });
      data[this.tableName] = remaining;
      saveMockData(data);
      return { data: null, error: null };
    }

    return { data: [], error: null };
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

// Mock Supabase Client Object
const mockSupabase = {
  from: (tableName: string) => new MockQueryBuilder(tableName)
};

// Export the active client
export const supabase = realSupabase || (mockSupabase as any);
