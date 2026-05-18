-- Candidates table
CREATE TABLE candidates (
  id BIGSERIAL PRIMARY KEY,
  position_key TEXT NOT NULL,
  gender TEXT NOT NULL,
  name TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table
CREATE TABLE votes (
  id BIGSERIAL PRIMARY KEY,
  position_key TEXT NOT NULL,
  gender TEXT NOT NULL,
  candidate_id BIGINT REFERENCES candidates(id),
  voter_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One vote per person per position+gender slot
CREATE UNIQUE INDEX one_vote_per_slot
  ON votes (position_key, gender, voter_token);

-- Voting status (on/off switch)
CREATE TABLE voting_status (
  id INT PRIMARY KEY DEFAULT 1,
  is_open BOOLEAN DEFAULT TRUE,
  results_released BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the default open status
INSERT INTO voting_status (id, is_open, results_released) VALUES (1, TRUE, FALSE);
