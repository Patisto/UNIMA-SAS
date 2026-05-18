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

// exact finalists list from user
const finalists = [
  // Most Prayerful
  { position_key: 'most_prayerful', gender: 'male', name: 'Chisomo Phiri', photo_url: 'https://i.ibb.co/SDXnmv7g/chisomo-phiri.jpg' },
  { position_key: 'most_prayerful', gender: 'male', name: 'Gracious Chimata', photo_url: 'https://i.ibb.co/20bmhwWk/gracious-chimata.jpg' },
  { position_key: 'most_prayerful', gender: 'male', name: 'Aubrey Chafuwa', photo_url: 'https://i.ibb.co/XxmXJrFC/aubrey.jpg' },
  { position_key: 'most_prayerful', gender: 'female', name: 'Dorothy Kaulimbo', photo_url: 'https://i.ibb.co/TDNJwrXF/dorothy.jpg' },
  { position_key: 'most_prayerful', gender: 'female', name: 'Neister Mbuzi', photo_url: 'https://i.ibb.co/m5kmxzYQ/neister.jpg' },
  { position_key: 'most_prayerful', gender: 'female', name: 'Mphatso George', photo_url: 'https://i.ibb.co/Dfyy9LXr/mphatso.jpg' },
  { position_key: 'most_prayerful', gender: 'female', name: 'Deborah Vumbwe', photo_url: 'https://i.ibb.co/Qj3jGqZ7/deborah.jpg' },

  // Most Dedicated
  { position_key: 'most_dedicated', gender: 'male', name: 'Gracious Chimata', photo_url: 'https://i.ibb.co/20bmhwWk/gracious-chimata.jpg' },
  { position_key: 'most_dedicated', gender: 'male', name: 'Chisomo Phiri', photo_url: 'https://i.ibb.co/SDXnmv7g/chisomo-phiri.jpg' },
  { position_key: 'most_dedicated', gender: 'male', name: 'Raymond Daudi', photo_url: 'https://i.ibb.co/FLTgRBth/raymond.jpg' },
  { position_key: 'most_dedicated', gender: 'female', name: 'Neister Mbuzi', photo_url: 'https://i.ibb.co/m5kmxzYQ/neister.jpg' },
  { position_key: 'most_dedicated', gender: 'female', name: 'Annie Kaulimbo', photo_url: 'https://i.ibb.co/YTtmmjdQ/annie.jpg' },
  { position_key: 'most_dedicated', gender: 'female', name: 'Takondwa Chionera', photo_url: 'https://i.ibb.co/XZywM9Jz/takondwa.jpg' },
  { position_key: 'most_dedicated', gender: 'female', name: 'Angella Chatha', photo_url: 'https://i.ibb.co/rRtKzSZX/angella.jpg' },

  // Golden Voice
  { position_key: 'golden_voice', gender: 'male', name: 'Mwai Manja', photo_url: 'https://i.ibb.co/vCHQ87X8/mwayi-manja.jpg' },
  { position_key: 'golden_voice', gender: 'male', name: 'Chisomo Phiri', photo_url: 'https://i.ibb.co/SDXnmv7g/chisomo-phiri.jpg' },
  { position_key: 'golden_voice', gender: 'female', name: 'Bertha Dzuwa', photo_url: 'https://i.ibb.co/kgpgVsRj/bertha.jpg' },
  { position_key: 'golden_voice', gender: 'female', name: 'Angella Chatha', photo_url: 'https://i.ibb.co/rRtKzSZX/angella.jpg' },
  { position_key: 'golden_voice', gender: 'female', name: 'Vanessa Chopika', photo_url: 'without image' },
  { position_key: 'golden_voice', gender: 'female', name: 'Deborah Vumbwe', photo_url: 'https://i.ibb.co/Qj3jGqZ7/deborah.jpg' },

  // Well Dressed
  { position_key: 'well_dressed', gender: 'male', name: 'Michael Masudi', photo_url: 'https://i.ibb.co/Q36hQ1Yz/micheal-masudi.jpg' },
  { position_key: 'well_dressed', gender: 'male', name: 'Chisomo Phiri', photo_url: 'https://i.ibb.co/SDXnmv7g/chisomo-phiri.jpg' },
  { position_key: 'well_dressed', gender: 'female', name: 'Annie Kaulimbo', photo_url: 'https://i.ibb.co/YTtmmjdQ/annie.jpg' },
  { position_key: 'well_dressed', gender: 'female', name: 'Lindiwe Makala', photo_url: 'without image' },
  { position_key: 'well_dressed', gender: 'female', name: 'Bertha Dzuwa', photo_url: 'https://i.ibb.co/kgpgVsRj/bertha.jpg' },

  // Sociable Person
  { position_key: 'sociable_person', gender: 'male', name: 'Aubrey Chafuwa', photo_url: 'https://i.ibb.co/XxmXJrFC/aubrey.jpg' },
  { position_key: 'sociable_person', gender: 'male', name: 'Gracious Chimata', photo_url: 'https://i.ibb.co/20bmhwWk/gracious-chimata.jpg' },
  { position_key: 'sociable_person', gender: 'male', name: 'Raymond Daudi', photo_url: 'https://i.ibb.co/FLTgRBth/raymond.jpg' },
  { position_key: 'sociable_person', gender: 'female', name: 'Neister Mbuzi', photo_url: 'https://i.ibb.co/m5kmxzYQ/neister.jpg' },
  { position_key: 'sociable_person', gender: 'female', name: 'Hellen Kawerama', photo_url: 'https://i.ibb.co/kgVc0L23/hellen.jpg' },
  { position_key: 'sociable_person', gender: 'female', name: 'Thandeka', photo_url: 'https://i.ibb.co/LDvsyg0w/thandeka.jpg' },
];

async function main() {
  // Delete existing candidates for these positions
  const { error: delError } = await supabase
    .from('candidates')
    .delete()
    .in('position_key', positions);

  if (delError) throw delError;

  // Insert the finalists exactly as provided
  const { error: insertError } = await supabase.from('candidates').insert(finalists);
  if (insertError) throw insertError;

  console.log(JSON.stringify({ status: 'ok', deleted_positions: positions.length, inserted: finalists.length }, null, 2));
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
