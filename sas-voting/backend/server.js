require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;
const ADMIN_KEY = process.env.ADMIN_KEY || 'sas-vote-admin-2025';

const supabase = createClient(
  process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.use(cors());
app.use(express.json());

function requireAdmin(req, res, next) {
  if (req.headers['x-admin-key'] !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  next();
}

app.get('/api/voting/status', async (req, res) => {
  const { data, error } = await supabase
    .from('voting_status')
    .select('is_open')
    .eq('id', 1)
    .single();

  if (error) return res.status(500).json({ error: 'Failed to get status.' });
  res.json({ is_open: data.is_open });
});

app.get('/api/candidates', async (req, res) => {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .order('position_key')
    .order('gender')
    .order('name');

  if (error) return res.status(500).json({ error: 'Failed to fetch candidates.' });
  res.json({ candidates: data });
});

app.post('/api/vote', async (req, res) => {
  const { votes, voter_token } = req.body;

  if (!voter_token || !votes || !Array.isArray(votes) || votes.length === 0) {
    return res.status(400).json({ error: 'Invalid request.' });
  }

  const { data: status } = await supabase
    .from('voting_status')
    .select('is_open')
    .eq('id', 1)
    .single();

  if (!status?.is_open) {
    return res.status(403).json({ error: 'Voting is closed.' });
  }

  const { data: existing } = await supabase
    .from('votes')
    .select('id')
    .eq('voter_token', voter_token)
    .in('position_key', votes.map(v => v.position_key));

  if (existing && existing.length > 0) {
    return res.status(409).json({ error: 'Already voted.' });
  }

  const rows = votes.map(v => ({
    position_key: v.position_key,
    gender: v.gender,
    candidate_id: v.candidate_id,
    voter_token,
  }));

  const { error } = await supabase.from('votes').insert(rows);

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Already voted.' });
    }
    return res.status(500).json({ error: 'Failed to save vote.' });
  }

  res.status(201).json({ message: 'Vote recorded.' });
});

app.get('/api/admin/results', requireAdmin, async (req, res) => {
  const { data: votes, error: vErr } = await supabase
    .from('votes')
    .select('position_key, gender, candidate_id, candidates(name, photo_url)');

  const { data: status } = await supabase
    .from('voting_status')
    .select('is_open')
    .eq('id', 1)
    .single();

  const { count: totalVoters } = await supabase
    .from('votes')
    .select('voter_token', { count: 'exact', head: true });

  if (vErr) return res.status(500).json({ error: 'Failed to fetch results.' });

  const tally = {};
  votes.forEach(v => {
    const slotKey = `${v.position_key}__${v.gender}`;
    if (!tally[slotKey]) tally[slotKey] = {};
    const name = v.candidates?.name || `ID ${v.candidate_id}`;
    tally[slotKey][name] = (tally[slotKey][name] || 0) + 1;
  });

  res.json({
    is_open: status?.is_open,
    total_voters: totalVoters,
    tally,
  });
});

app.post('/api/admin/voting/toggle', requireAdmin, async (req, res) => {
  const { is_open } = req.body;

  const { error } = await supabase
    .from('voting_status')
    .update({ is_open, updated_at: new Date().toISOString() })
    .eq('id', 1);

  if (error) return res.status(500).json({ error: 'Failed to update status.' });
  res.json({ is_open });
});

app.post('/api/admin/candidates', requireAdmin, async (req, res) => {
  const { position_key, gender, name, photo_url } = req.body;

  if (!position_key || !gender || !name) {
    return res.status(400).json({ error: 'position_key, gender, and name are required.' });
  }

  const { data, error } = await supabase
    .from('candidates')
    .insert([{ position_key, gender, name, photo_url }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to add candidate.' });
  res.status(201).json({ candidate: data });
});

app.put('/api/admin/candidates/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { position_key, gender, name, photo_url } = req.body;

  if (!position_key || !gender || !name) {
    return res.status(400).json({ error: 'position_key, gender, and name are required.' });
  }

  const { data, error } = await supabase
    .from('candidates')
    .update({ position_key, gender, name, photo_url })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to update candidate.' });
  res.json({ candidate: data });
});

app.delete('/api/admin/candidates/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('candidates').delete().eq('id', id);
  if (error) return res.status(500).json({ error: 'Failed to delete.' });
  res.json({ message: 'Deleted.' });
});

app.get('/api/admin/export', requireAdmin, async (req, res) => {
  const { data: votes } = await supabase
    .from('votes')
    .select('*, candidates(name, position_key, gender)')
    .order('created_at');

  const { data: status } = await supabase
    .from('voting_status')
    .select('is_open')
    .eq('id', 1)
    .single();

  res.json({ is_open: status?.is_open, votes });
});

app.listen(PORT, () => {
  console.log(`SAS Voting server running on port ${PORT}`);
});
