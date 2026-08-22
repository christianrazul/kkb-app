ALTER TABLE expense_group
    ADD COLUMN time_format VARCHAR(24) NOT NULL DEFAULT 'TWELVE_HOUR';

ALTER TABLE expense_group
    ADD CONSTRAINT ck_expense_group_time_format
        CHECK (time_format IN ('TWELVE_HOUR', 'TWENTY_FOUR_HOUR'));

ALTER TABLE expense
    ADD COLUMN expense_time TIME;
