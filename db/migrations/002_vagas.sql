-- Migration 002: suporte a vagas (kind + campos de emprego)

ALTER TABLE opportunities ADD COLUMN kind TEXT NOT NULL DEFAULT 'freelance';
ALTER TABLE opportunities ADD COLUMN company_name TEXT;
ALTER TABLE opportunities ADD COLUMN location TEXT;
ALTER TABLE opportunities ADD COLUMN remote INTEGER NOT NULL DEFAULT 0;
ALTER TABLE opportunities ADD COLUMN employment_type TEXT;
ALTER TABLE opportunities ADD COLUMN salary_min REAL;
ALTER TABLE opportunities ADD COLUMN salary_max REAL;

CREATE INDEX IF NOT EXISTS idx_opportunities_kind ON opportunities(kind);
