require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const positions = [
  'most_prayerful',
  'most_dedicated',
  'golden_voice',
  'well_dressed',
  'sociable_person',
];

async function main() {
  const { data, error, count } = await supabase
    .from('candidates')
    .select('id, position_key, gender, name, photo_url', { count: 'exact' })
    .in('position_key', positions)
    .order('position_key', { ascending: true })
    .order('gender', { ascending: true });

  if (error) throw error;

  console.log(JSON.stringify({ count: data.length, rows: data }, null, 2));
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
