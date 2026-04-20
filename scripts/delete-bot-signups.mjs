import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const since = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(); // 3h window (covers the botting)
const { data: profiles, error } = await supabase
  .from('profiles')
  .select('id, email, full_name, onboarding_complete, created_at')
  .gte('created_at', since)
  .order('created_at', { ascending: true });

if (error) { console.error('fetch failed:', error); process.exit(1); }

console.log(`Candidate signups since ${since}: ${profiles.length}`);

let deleted = 0, skipped = 0, failed = 0;
const skippedRows = [];

for (const p of profiles) {
  // Per-account safety net: refuse to delete if ANY of these are non-zero
  const [{ count: posts }, { count: comments }, { count: msgs }, { count: fA }, { count: fB }] = await Promise.all([
    supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', p.id),
    supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', p.id),
    supabase.from('messages').select('*', { count: 'exact', head: true }).eq('sender_id', p.id),
    supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('user_id', p.id),
    supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('friend_id', p.id),
  ]);

  const hasContent = (posts || 0) + (comments || 0) + (msgs || 0) + (fA || 0) + (fB || 0) > 0;
  const hasProfile = (p.full_name && p.full_name.trim() !== '') || p.onboarding_complete;

  if (hasContent || hasProfile) {
    skipped++;
    skippedRows.push({ id: p.id, email: p.email, posts, comments, msgs, friends: (fA || 0) + (fB || 0), full_name: p.full_name, onboarding_complete: p.onboarding_complete });
    continue;
  }

  const { error: delErr } = await supabase.auth.admin.deleteUser(p.id);
  if (delErr) {
    failed++;
    console.log(`FAIL ${p.email} — ${delErr.message}`);
  } else {
    deleted++;
    if (deleted % 50 === 0) console.log(`... deleted ${deleted}`);
  }
}

console.log(`\nDone. deleted=${deleted} skipped=${skipped} failed=${failed}`);
if (skippedRows.length) {
  console.log('\nSkipped rows (kept for your review):');
  for (const r of skippedRows) console.log(r);
}
