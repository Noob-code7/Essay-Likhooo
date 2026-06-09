import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(columns: string = '*') {
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
    const data = loadMockData();
    const list = data[this.tableName] || [];
    const filtered = list.filter((item: any) => {
      return this.filters.every(f => String(item[f.col]) === String(f.val));
    });

    if (filtered.length === 0) {
      return { data: null, error: { message: 'Row not found', code: 'PGRST116' } };
    }
    return { data: filtered[0], error: null };
  }

  async insert(rows: any | any[]) {
    const data = loadMockData();
    if (!data[this.tableName]) data[this.tableName] = [];
    
    const newRows = Array.isArray(rows) ? rows : [rows];
    const createdRows = newRows.map((row: any) => ({
      id: row.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...row
    }));

    data[this.tableName].push(...createdRows);
    saveMockData(data);

    return { data: Array.isArray(rows) ? createdRows : createdRows[0], error: null };
  }

  async update(values: any) {
    const data = loadMockData();
    const list = data[this.tableName] || [];
    
    let updatedCount = 0;
    const updatedList = list.map((item: any) => {
      const match = this.filters.every(f => String(item[f.col]) === String(f.val));
      if (match) {
        updatedCount++;
        return { ...item, ...values, updated_at: new Date().toISOString() };
      }
      return item;
    });

    data[this.tableName] = updatedList;
    saveMockData(data);

    return { data: values, error: null, count: updatedCount };
  }

  async delete() {
    const data = loadMockData();
    const list = data[this.tableName] || [];
    const remaining = list.filter((item: any) => {
      return !this.filters.every(f => String(item[f.col]) === String(f.val));
    });
    data[this.tableName] = remaining;
    saveMockData(data);
    return { error: null };
  }

  // Promise-like then to return mock list directly for await
  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    const data = loadMockData();
    const list = data[this.tableName] || [];
    const filtered = list.filter((item: any) => {
      return this.filters.every(f => String(item[f.col]) === String(f.val));
    });
    return Promise.resolve({ data: filtered, error: null }).then(onfulfilled, onrejected);
  }
}

// Mock Supabase Client Object
const mockSupabase = {
  from: (tableName: string) => new MockQueryBuilder(tableName)
};

// Export the active client
export const supabase = realSupabase || (mockSupabase as any);
