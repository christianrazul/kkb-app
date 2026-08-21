ALTER TABLE group_invite
    ADD COLUMN token VARCHAR(64);

UPDATE group_invite
SET token = CAST(id AS VARCHAR)
WHERE token IS NULL;

ALTER TABLE group_invite
    ALTER COLUMN token SET NOT NULL;

ALTER TABLE group_invite
    ADD CONSTRAINT uq_group_invite_token UNIQUE (token);

ALTER TABLE group_invite
    DROP CONSTRAINT ck_group_invite_status;

ALTER TABLE group_invite
    ADD CONSTRAINT ck_group_invite_status CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED'));

CREATE TABLE email_outbox (
    id UUID PRIMARY KEY,
    group_invite_id UUID REFERENCES group_invite(id) ON DELETE CASCADE,
    requested_by_user_id UUID NOT NULL REFERENCES app_user(id),
    recipient_email VARCHAR(320) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    text_body TEXT NOT NULL,
    html_body TEXT NOT NULL,
    status VARCHAR(16) NOT NULL,
    attempt_count INTEGER NOT NULL,
    next_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_error VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ck_email_outbox_status CHECK (status IN ('QUEUED', 'SENT', 'FAILED', 'CANCELLED')),
    CONSTRAINT ck_email_outbox_attempt_count CHECK (attempt_count >= 0)
);

CREATE INDEX idx_email_outbox_delivery ON email_outbox(status, next_attempt_at);
CREATE INDEX idx_email_outbox_group_invite ON email_outbox(group_invite_id, created_at DESC);
CREATE INDEX idx_email_outbox_recipient_created ON email_outbox(recipient_email, created_at DESC);
CREATE INDEX idx_email_outbox_requester_created ON email_outbox(requested_by_user_id, created_at DESC);
