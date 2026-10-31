CREATE TABLE IF NOT EXISTS sf_licenses (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sf_activation_codes (
    id UUID PRIMARY KEY,
    code_hash TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    redeemed_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    license_id UUID REFERENCES sf_licenses(id)
);

CREATE TABLE IF NOT EXISTS sf_license_sessions (
    token_hash TEXT PRIMARY KEY,
    license_id UUID NOT NULL REFERENCES sf_licenses(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sf_admin_sessions (
    token_hash TEXT PRIMARY KEY,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sf_admin_security (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton),
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ
);
INSERT INTO sf_admin_security(singleton) VALUES (TRUE) ON CONFLICT (singleton) DO NOTHING;

CREATE TABLE IF NOT EXISTS sf_license_audit (
    id BIGSERIAL PRIMARY KEY,
    event TEXT NOT NULL,
    outcome TEXT NOT NULL,
    client_ip TEXT,
    user_agent TEXT,
    license_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sf_license_audit_created_idx ON sf_license_audit(created_at DESC);
