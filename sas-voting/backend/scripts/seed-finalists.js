require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Finalists list provided by the user. photo_url = 'without image' when missing.
const finalists = [
  // MOST PRAYERFUL - male
  { position_key: 'most_prayerful', gender: 'male', name: 'Chisomo Phiri', photo_url: 'https://i.ibb.co/SDXnmv7g/chisomo-phiri.jpg' },
  { position_key: 'most_prayerful', gender: 'male', name: 'Gracious Chimata', photo_url: 'https://i.ibb.co/20bmhwWk/gracious-chimata.jpg' },
  { position_key: 'most_prayerful', gender: 'male', name: 'Aubrey Chafuwa', photo_url: 'https://i.ibb.co/XxmXJrFC/aubrey.jpg' },

  // MOST PRAYERFUL - female
  { position_key: 'most_prayerful', gender: 'female', name: 'Dorothy Kaulimbo', photo_url: 'https://i.ibb.co/TDNJwrXF/dorothy.jpg' },
  { position_key: 'most_prayerful', gender: 'female', name: 'Neister Mbuzi', photo_url: 'https://i.ibb.co/m5kmxzYQ/neister.jpg' },
  { position_key: 'most_prayerful', gender: 'female', name: 'Mphatso George', photo_url: 'https://i.ibb.co/Dfyy9LXr/mphatso.jpg' },

  // MOST DEDICATED - male
  { position_key: 'most_dedicated', gender: 'male', name: 'Gracious Chimata', photo_url: 'https://i.ibb.co/20bmhwWk/gracious-chimata.jpg' },
  { position_key: 'most_dedicated', gender: 'male', name: 'Chisomo Phiri', photo_url: 'https://i.ibb.co/SDXnmv7g/chisomo-phiri.jpg' },
  { position_key: 'most_dedicated', gender: 'male', name: 'Raymond Daudi', photo_url: 'https://i.ibb.co/FLTgRBth/raymond.jpg' },

  // MOST DEDICATED - female
  { position_key: 'most_dedicated', gender: 'female', name: 'Neister Mbuzi', photo_url: 'https://i.ibb.co/m5kmxzYQ/neister.jpg' },
  { position_key: 'most_dedicated', gender: 'female', name: 'Annie Kaulimbo', photo_url: 'https://i.ibb.co/YTtmmjdQ/annie.jpg' },
  { position_key: 'most_dedicated', gender: 'female', name: 'Takondwa Chionera', photo_url: 'https://i.ibb.co/XZywM9Jz/takondwa.jpg' },

  // GOLDEN VOICE - male
  { position_key: 'golden_voice', gender: 'male', name: 'Mwayi Manja', photo_url: 'https://i.ibb.co/vCHQ87X8/mwayi-manja.jpg' },
  { position_key: 'golden_voice', gender: 'male', name: 'Chisomo Phiri', photo_url: 'https://i.ibb.co/SDXnmv7g/chisomo-phiri.jpg' },

  // GOLDEN VOICE - female
  { position_key: 'golden_voice', gender: 'female', name: 'Bertha Dzuwa', photo_url: 'https://i.ibb.co/kgpgVsRj/bertha.jpg' },
  { position_key: 'golden_voice', gender: 'female', name: 'Angella Chatha', photo_url: 'https://i.ibb.co/rRtKzSZX/angella.jpg' },
  { position_key: 'golden_voice', gender: 'female', name: 'Deborah Vumbwe', photo_url: 'https://i.ibb.co/Qj3jGqZ7/deborah.jpg' },
  { position_key: 'golden_voice', gender: 'female', name: 'Vanessa Chopika', photo_url: 'without image' },

  // WELL DRESSED - male
  { position_key: 'well_dressed', gender: 'male', name: 'Michael Masudi', photo_url: 'https://i.ibb.co/Q36hQ1Yz/micheal-masudi.jpg' },
  { position_key: 'well_dressed', gender: 'male', name: 'Chisomo Phiri', photo_url: 'https://i.ibb.co/SDXnmv7g/chisomo-phiri.jpg' },
  { position_key: 'well_dressed', gender: 'male', name: 'Raymond Daudi', photo_url: 'https://i.ibb.co/FLTgRBth/raymond.jpg' },

  // WELL DRESSED - female
  { position_key: 'well_dressed', gender: 'female', name: 'Annie Kaulimbo', photo_url: 'https://i.ibb.co/YTtmmjdQ/annie.jpg' },
  { position_key: 'well_dressed', gender: 'female', name: 'Lindiwe Makala', photo_url: 'without image' },
  { position_key: 'well_dressed', gender: 'female', name: 'Hellen Kawerama', photo_url: 'https://i.ibb.co/kgVc0L23/hellen.jpg' },

  // SOCIABLE PERSON - male
  { position_key: 'sociable_person', gender: 'male', name: 'Aubrey Chafuwa', photo_url: 'https://i.ibb.co/XxmXJrFC/aubrey.jpg' },
  { position_key: 'sociable_person', gender: 'male', name: 'Raymond Daudi', photo_url: 'https://i.ibb.co/FLTgRBth/raymond.jpg' },
  { position_key: 'sociable_person', gender: 'male', name: 'Gracious Chimata', photo_url: 'https://i.ibb.co/20bmhwWk/gracious-chimata.jpg' },

  // SOCIABLE PERSON - female
  { position_key: 'sociable_person', gender: 'female', name: 'Neister Mbuzi', photo_url: 'https://i.ibb.co/m5kmxzYQ/neister.jpg' },
  { position_key: 'sociable_person', gender: 'female', name: 'Hellen Kawerama', photo_url: 'https://i.ibb.co/kgVc0L23/hellen.jpg' },
  { position_key: 'sociable_person', gender: 'female', name: 'Thandeka', photo_url: 'https://i.ibb.co/LDvsyg0w/thandeka.jpg' },
];

function normalizeName(name) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ');
}

async function main() {
  const { data: existing, error: fetchError } = await supabase
    .from('candidates')
    .select('id, position_key, gender, name, photo_url');

  if (fetchError) throw fetchError;

  const existingMap = new Map(
    (existing || []).map(row => [
      `${row.position_key}|${row.gender}|${normalizeName(row.name)}`,
      row,
    ])
  );

  let inserted = 0;
  let updated = 0;

  for (const candidate of finalists) {
    const key = `${candidate.position_key}|${candidate.gender}|${normalizeName(candidate.name)}`;
    const current = existingMap.get(key);

    if (current) {
      const needsUpdate =
        current.name !== candidate.name ||
        current.photo_url !== candidate.photo_url;

      if (needsUpdate) {
        const { error } = await supabase
          .from('candidates')
          .update({ name: candidate.name, photo_url: candidate.photo_url })
          .eq('id', current.id);

        if (error) throw error;
        updated += 1;
      }
      continue;
    }

    const { error } = await supabase.from('candidates').insert(candidate);
    if (error) throw error;
    inserted += 1;
  }

  console.log(JSON.stringify({ inserted, updated, totalSeeded: finalists.length }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
