
--
-- admin                         -> Admin@1234
-- nguyen.van.a / tran.thi.b /
-- le.van.c (V3 demo users)      -> User@1234
-- huunhat / hoangphuc /
-- thephong / manhthang (init)   -> Password123!
-- ============================================================

-- V3 admin hash -> Admin@1234
UPDATE users
SET password_hash = '$2a$10$JizcpfkO7BoN5tAcZJQHB.6mnaSYOgEveja8KLEYbOuj9Lx7uKtvG'
WHERE username = 'admin'
  AND password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lheO';

-- V3 regular users hash -> User@1234
UPDATE users
SET password_hash = '$2a$10$86fLoZ5NALyKu6SO47X5POKAZo0qxh6kgzq4m5N7MCY1a/SchuntC'
WHERE username IN ('nguyen.van.a', 'tran.thi.b', 'le.van.c')
  AND password_hash = '$2a$10$FCA.9j3jnxQJQNh.vISuB.qJQ2/3LGx0w5DEr0.Zo0hv3C0nOigeG';

-- database/init.sql users -> Password123!
UPDATE users
SET password_hash = '$2a$10$wqEaogl8Gt.wKEc7raIlKuRhluuHTOabgi.hDxQwMIH4DuNvmayJ6'
WHERE username IN ('huunhat', 'hoangphuc', 'thephong', 'manhthang')
  AND password_hash IN (
      '$2a$10$FCA.9j3jnxQJQNh.vISuB.qJQ2/3LGx0w5DEr0.Zo0hv3C0nOigeG',
      '$2a$10$wK1k6V78j2rR6K/4w646ceB5i/Qv37gG08hZ7F5v7jQ2t7y8u9i0.'
  );
