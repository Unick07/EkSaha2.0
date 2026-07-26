CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'Active',
  monthly_price INTEGER NOT NULL DEFAULT 0,
  owner_id TEXT REFERENCES users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE service_assignments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  service_id TEXT NOT NULL REFERENCES services(id),
  status TEXT NOT NULL DEFAULT 'Active',
  assigned_at TEXT NOT NULL,
  UNIQUE(user_id, service_id)
);

CREATE INDEX idx_services_owner_id ON services(owner_id);
CREATE INDEX idx_service_assignments_service_id ON service_assignments(service_id);
CREATE INDEX idx_service_assignments_user_id ON service_assignments(user_id);

ALTER TABLE tickets ADD COLUMN service_id TEXT REFERENCES services(id);

INSERT INTO services (id, name, slug, description, category, status, monthly_price, owner_id, created_at, updated_at) VALUES
  ('svc-web', 'Web Development', 'web', 'Conversion-led websites that load quickly, scale cleanly and stay maintained.', 'General', 'Active', 0, NULL, '2026-07-26T00:00:00.000Z', '2026-07-26T00:00:00.000Z'),
  ('svc-seo', 'SEO', 'seo', 'Technical, content and authority systems that turn search into a reliable growth channel.', 'General', 'Active', 0, NULL, '2026-07-26T00:00:00.000Z', '2026-07-26T00:00:00.000Z'),
  ('svc-ads', 'Advertising', 'ads', 'High-intent campaigns with transparent reporting and relentless experimentation.', 'General', 'Active', 0, NULL, '2026-07-26T00:00:00.000Z', '2026-07-26T00:00:00.000Z'),
  ('svc-it-support', 'Tech Guidance', 'it-support', 'Responsive help desk and proactive monitoring without the cost of an in-house team.', 'General', 'Active', 0, NULL, '2026-07-26T00:00:00.000Z', '2026-07-26T00:00:00.000Z');
