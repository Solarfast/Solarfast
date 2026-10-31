ALTER TABLE sf_licenses
    ADD COLUMN IF NOT EXISTS account_label TEXT NOT NULL DEFAULT '';

ALTER TABLE sf_activation_codes
    ADD COLUMN IF NOT EXISTS code_reference TEXT NOT NULL DEFAULT '';

ALTER TABLE sf_license_audit
    ADD COLUMN IF NOT EXISTS account_label TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS code_reference TEXT NOT NULL DEFAULT '';

UPDATE sf_activation_codes
SET code_reference = 'oud-' || right(code_hash, 8)
WHERE code_reference = '';

CREATE INDEX IF NOT EXISTS sf_activation_codes_license_idx
    ON sf_activation_codes (license_id, created_at DESC);
