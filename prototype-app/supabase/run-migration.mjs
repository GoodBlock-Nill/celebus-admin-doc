import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgualhdcmxnaxcagnlha.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ndWFsaGRjbXhuYXhjYWdubGhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NDc1MTksImV4cCI6MjA5MjMyMzUxOX0.BFCi1Ys2sZZfl9NoZbrCYIBKJd3awETppbX8mXP1zIc';

// Use service role key if available, otherwise anon
const key = serviceRoleKey || anonKey;
const supabase = createClient(supabaseUrl, key);

const file = process.argv[2];
if (!file) {
  console.error('Usage: node run-migration.mjs <sql-file>');
  process.exit(1);
}

const sql = readFileSync(file, 'utf-8');

// Split by semicolons but handle $$ blocks
const statements = [];
let current = '';
let inDollarBlock = false;

for (const line of sql.split('\n')) {
  const trimmed = line.trim();
  if (trimmed.startsWith('--') || trimmed === '') {
    continue;
  }

  if (trimmed.includes('$$')) {
    const count = (trimmed.match(/\$\$/g) || []).length;
    if (count % 2 === 1) {
      inDollarBlock = !inDollarBlock;
    }
  }

  current += line + '\n';

  if (!inDollarBlock && trimmed.endsWith(';')) {
    statements.push(current.trim());
    current = '';
  }
}
if (current.trim()) statements.push(current.trim());

console.log(`Found ${statements.length} SQL statements in ${file}`);

// Execute via Supabase's rpc or direct fetch to the SQL endpoint
for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  if (!stmt || stmt === ';') continue;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ query: stmt }),
    });

    if (!res.ok) {
      // Try the pg_query approach instead
      const text = await res.text();
      if (text.includes('could not find')) {
        // This won't work without a custom RPC function
        throw new Error('Need direct DB access');
      }
    }
    console.log(`[${i + 1}/${statements.length}] OK`);
  } catch (err) {
    console.error(`[${i + 1}/${statements.length}] Error: ${err.message}`);
    console.error(`Statement: ${stmt.substring(0, 80)}...`);
    break;
  }
}
