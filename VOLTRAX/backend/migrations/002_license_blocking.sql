ALTER TABLE sf_licenses
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS sf_license_sessions_one_active_per_license_idx
ON sf_license_sessions (license_id)
WHERE revoked_at IS NULL;
