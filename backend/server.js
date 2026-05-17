require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !/^https?:\/\//i.test(SUPABASE_URL)) {
  console.error('Invalid SUPABASE_URL: Must be a valid HTTP or HTTPS URL.');
  console.error('Set `SUPABASE_URL` to your project URL (e.g. https://xyz.supabase.co) in backend/.env or environment.');
  console.error('Current SUPABASE_URL:', SUPABASE_URL);
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

app.use(cors());
app.use(express.json());

// ──────────────────────────────────────────────
// SUBMIT A NOMINATION
// ──────────────────────────────────────────────
app.post('/api/nominations', async (req, res) => {
  const { nominations } = req.body;
  // nominations = array of { position_key, gender, nominee_name }

  if (!nominations || !Array.isArray(nominations) || nominations.length === 0) {
    return res.status(400).json({ error: 'No nominations provided.' });
  }

  const { data, error } = await supabase
    .from('nominations')
    .insert(nominations);

  if (error) {
    console.error('Supabase insert error:', error);
    return res.status(500).json({ error: 'Failed to save nominations.' });
  }

  // Get updated total submission count (count distinct submission_batch)
  const { count, error: countError } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true });

  return res.status(201).json({ message: 'Nominations submitted!', submissionCount: count });
});

// ──────────────────────────────────────────────
// LOG A SUBMISSION (called together with nominations)
// ──────────────────────────────────────────────
app.post('/api/submissions', async (req, res) => {
  const { data, error } = await supabase
    .from('submissions')
    .insert([{ submitted_at: new Date().toISOString() }]);

  if (error) {
    console.error('Supabase submission error:', error);
    return res.status(500).json({ error: 'Failed to log submission.' });
  }

  const { count } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true });

  return res.status(201).json({ count });
});

// ──────────────────────────────────────────────
// GET SUBMISSION COUNT
// ──────────────────────────────────────────────
app.get('/api/submissions/count', async (req, res) => {
  const { count, error } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true });

  if (error) return res.status(500).json({ error: 'Failed to fetch count.' });

  return res.json({ count });
});

// ──────────────────────────────────────────────
// GET ALL NOMINATIONS (for results page)
// ──────────────────────────────────────────────
app.get('/api/nominations', async (req, res) => {
  const { data, error } = await supabase
    .from('nominations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: 'Failed to fetch nominations.' });

  return res.json({ nominations: data });
});

// ──────────────────────────────────────────────
// ADMIN: DOWNLOAD ALL DATA AS JSON
// ──────────────────────────────────────────────
app.get('/api/admin/export', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== 'sas-admin-2025') {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const { data: nominations, error: nomError } = await supabase
    .from('nominations')
    .select('*')
    .order('created_at', { ascending: true });

  const { count } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true });

  if (nomError) return res.status(500).json({ error: 'Export failed.' });

  return res.json({ totalSubmissions: count, nominations });
});

// ──────────────────────────────────────────────
// ADMIN: CLEAR ALL DATA (destructive)
// ──────────────────────────────────────────────
app.post('/api/admin/clear', async (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== 'sas-admin-2025') {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  try {
    // delete all nominations
    const { error: delNomErr } = await supabase
      .from('nominations')
      .delete()
      .neq('id', 0);

    if (delNomErr) {
      console.error('Failed to clear nominations:', delNomErr);
      return res.status(500).json({ error: 'Failed to clear nominations.' });
    }

    // delete all submissions
    const { error: delSubErr } = await supabase
      .from('submissions')
      .delete()
      .neq('id', 0);

    if (delSubErr) {
      console.error('Failed to clear submissions:', delSubErr);
      return res.status(500).json({ error: 'Failed to clear submissions.' });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error('Clear admin error:', e);
    return res.status(500).json({ error: 'Clear failed.' });
  }
});

app.listen(PORT, () => {
  console.log(`SAS Nominations server running on port ${PORT}`);
});
