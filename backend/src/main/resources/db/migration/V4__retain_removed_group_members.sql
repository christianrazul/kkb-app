ALTER TABLE group_member
    ADD COLUMN removed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_group_member_active_user
    ON group_member(user_id, removed_at);
