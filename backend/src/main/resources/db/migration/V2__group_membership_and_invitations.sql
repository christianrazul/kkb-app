ALTER TABLE group_member
    ADD COLUMN role VARCHAR(16) NOT NULL DEFAULT 'MEMBER';

UPDATE group_member member
SET role = 'OWNER'
FROM expense_group expense_group
WHERE member.group_id = expense_group.id
  AND member.user_id = expense_group.created_by_user_id;

ALTER TABLE group_member
    ADD CONSTRAINT ck_group_member_role CHECK (role IN ('OWNER', 'MEMBER'));

CREATE TABLE group_invite (
    id UUID PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES expense_group(id) ON DELETE CASCADE,
    email VARCHAR(320) NOT NULL,
    invited_by_user_id UUID NOT NULL REFERENCES app_user(id),
    status VARCHAR(16) NOT NULL,
    accepted_by_user_id UUID REFERENCES app_user(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ck_group_invite_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REVOKED')),
    CONSTRAINT uq_group_invite_email UNIQUE (group_id, email)
);

CREATE INDEX idx_group_invite_email_status ON group_invite(email, status);
