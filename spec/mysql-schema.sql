-- MySQL Schema for LN Snake Game
-- Engine: InnoDB, charset utf8mb4

-- Players submitting scores
CREATE TABLE IF NOT EXISTS players (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_players_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Individual score submissions (used for leaderboard)
CREATE TABLE IF NOT EXISTS scores (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  player_id BIGINT UNSIGNED NOT NULL,
  time_ms INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_scores_time (time_ms),
  INDEX idx_scores_player (player_id),
  CONSTRAINT fk_scores_player FOREIGN KEY (player_id) REFERENCES players(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Game sessions (optional, captures multi-round attempts)
CREATE TABLE IF NOT EXISTS game_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  player_id BIGINT UNSIGNED NOT NULL,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME NULL,
  is_win TINYINT(1) NOT NULL DEFAULT 0,
  total_time_ms INT UNSIGNED NULL,
  fruits_collected INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  INDEX idx_sessions_player (player_id),
  INDEX idx_sessions_started (started_at),
  CONSTRAINT fk_sessions_player FOREIGN KEY (player_id) REFERENCES players(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Per-round times within a session (aligns with UI's playTimes)
CREATE TABLE IF NOT EXISTS session_attempts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  session_id BIGINT UNSIGNED NOT NULL,
  round_index TINYINT UNSIGNED NOT NULL,
  time_ms INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_attempt_round (session_id, round_index),
  INDEX idx_attempts_session (session_id),
  CONSTRAINT fk_attempts_session FOREIGN KEY (session_id) REFERENCES game_sessions(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- LNBits invoices for payments
CREATE TABLE IF NOT EXISTS invoices (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_hash VARCHAR(255) NOT NULL,
  bolt11 TEXT NOT NULL,
  amount_sats INT UNSIGNED NOT NULL,
  memo VARCHAR(255) NULL,
  status ENUM('pending','paid','expired','cancelled') NOT NULL DEFAULT 'pending',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invoices_payment_hash (payment_hash),
  INDEX idx_invoices_status (status),
  INDEX idx_invoices_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Convenience view for top 10 leaderboard (fast reads)
DROP VIEW IF EXISTS leaderboard_top10;
CREATE VIEW leaderboard_top10 AS
SELECT s.id AS score_id,
       p.name AS player_name,
       s.time_ms,
       s.created_at
FROM scores s
JOIN players p ON p.id = s.player_id
ORDER BY s.time_ms ASC, s.created_at ASC
LIMIT 10;
