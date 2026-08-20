CREATE TABLE app_user (
    id UUID PRIMARY KEY,
    google_subject VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(320) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE expense_group (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    tile_color VARCHAR(32) NOT NULL,
    created_by_user_id UUID NOT NULL REFERENCES app_user(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE group_member (
    id UUID PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES expense_group(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_user(id),
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_group_member UNIQUE (group_id, user_id)
);

CREATE TABLE fx_rate_snapshot (
    id UUID PRIMARY KEY,
    base_currency VARCHAR(3) NOT NULL,
    quote_currency VARCHAR(3) NOT NULL,
    base_units_per_quote_unit NUMERIC(20, 10) NOT NULL,
    effective_date DATE NOT NULL,
    provider VARCHAR(80) NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_fx_rate_positive CHECK (base_units_per_quote_unit > 0),
    CONSTRAINT ck_fx_currency_pair CHECK (base_currency <> quote_currency OR base_units_per_quote_unit = 1),
    CONSTRAINT uq_fx_rate_snapshot UNIQUE (base_currency, quote_currency, effective_date, provider)
);

CREATE TABLE expense (
    id UUID PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES expense_group(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    original_amount_minor BIGINT NOT NULL,
    original_currency VARCHAR(3) NOT NULL,
    fx_rate_snapshot_id UUID NOT NULL REFERENCES fx_rate_snapshot(id),
    php_amount_minor BIGINT NOT NULL,
    paid_by_user_id UUID NOT NULL REFERENCES app_user(id),
    expense_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_expense_original_amount_positive CHECK (original_amount_minor > 0),
    CONSTRAINT ck_expense_php_amount_positive CHECK (php_amount_minor > 0)
);

CREATE TABLE expense_share (
    id UUID PRIMARY KEY,
    expense_id UUID NOT NULL REFERENCES expense(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_user(id),
    original_amount_minor BIGINT NOT NULL,
    php_amount_minor BIGINT NOT NULL,
    CONSTRAINT ck_expense_share_original_nonnegative CHECK (original_amount_minor >= 0),
    CONSTRAINT ck_expense_share_php_nonnegative CHECK (php_amount_minor >= 0),
    CONSTRAINT uq_expense_share UNIQUE (expense_id, user_id)
);

CREATE TABLE settlement (
    id UUID PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES expense_group(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES app_user(id),
    to_user_id UUID NOT NULL REFERENCES app_user(id),
    original_amount_minor BIGINT NOT NULL,
    original_currency VARCHAR(3) NOT NULL,
    fx_rate_snapshot_id UUID NOT NULL REFERENCES fx_rate_snapshot(id),
    php_amount_minor BIGINT NOT NULL,
    settled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_settlement_different_users CHECK (from_user_id <> to_user_id),
    CONSTRAINT ck_settlement_original_amount_positive CHECK (original_amount_minor > 0),
    CONSTRAINT ck_settlement_php_amount_positive CHECK (php_amount_minor > 0)
);

CREATE INDEX idx_group_member_user ON group_member(user_id);
CREATE INDEX idx_expense_group_date ON expense(group_id, expense_date DESC);
CREATE INDEX idx_expense_share_user ON expense_share(user_id);
CREATE INDEX idx_settlement_group_date ON settlement(group_id, settled_at DESC);
CREATE INDEX idx_fx_rate_effective_date ON fx_rate_snapshot(effective_date DESC);

CREATE TABLE spring_session (
    primary_id CHAR(36) NOT NULL,
    session_id CHAR(36) NOT NULL,
    creation_time BIGINT NOT NULL,
    last_access_time BIGINT NOT NULL,
    max_inactive_interval INTEGER NOT NULL,
    expiry_time BIGINT NOT NULL,
    principal_name VARCHAR(100),
    CONSTRAINT spring_session_pk PRIMARY KEY (primary_id)
);

CREATE UNIQUE INDEX spring_session_ix1 ON spring_session(session_id);
CREATE INDEX spring_session_ix2 ON spring_session(expiry_time);
CREATE INDEX spring_session_ix3 ON spring_session(principal_name);

CREATE TABLE spring_session_attributes (
    session_primary_id CHAR(36) NOT NULL,
    attribute_name VARCHAR(200) NOT NULL,
    attribute_bytes BYTEA NOT NULL,
    CONSTRAINT spring_session_attributes_pk PRIMARY KEY (session_primary_id, attribute_name),
    CONSTRAINT spring_session_attributes_fk FOREIGN KEY (session_primary_id)
        REFERENCES spring_session(primary_id) ON DELETE CASCADE
);
