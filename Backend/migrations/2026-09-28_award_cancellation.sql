-- =========================================================
-- NallaBid: award cancellation with history
-- Run ONCE on nallbid_db, BEFORE restarting the backend with the new code.
--
-- What it does (no existing data is deleted):
--   1. Allows several award rows per RFQ, so a cancelled award stays as history.
--   2. Adds the CANCELLED status and who/when/why columns.
--   3. Keeps "one ACTIVE award per RFQ" enforced by the database through a
--      generated column that is NULL for cancelled awards (NULLs never clash
--      in a UNIQUE index).
-- =========================================================

START TRANSACTION;

-- 1. The foreign keys on rfq_id / quotation_id need an index; add plain ones
--    first so the old UNIQUE indexes can be dropped.
ALTER TABLE awards
    ADD INDEX ix_awards_rfq_id (rfq_id),
    ADD INDEX ix_awards_quotation_id (quotation_id);

ALTER TABLE awards
    DROP INDEX rfq_id,
    DROP INDEX quotation_id;

-- 2. New status value and cancellation details.
ALTER TABLE awards
    MODIFY status ENUM('AWARDED', 'COMPLETED', 'CANCELLED') NOT NULL,
    ADD COLUMN cancelled_at DATETIME NULL,
    ADD COLUMN cancelled_by INT NULL,
    ADD COLUMN cancel_reason VARCHAR(500) NULL,
    ADD CONSTRAINT fk_awards_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users (id);

-- 3. One active (not cancelled) award per RFQ.
ALTER TABLE awards
    ADD COLUMN active_rfq_id BIGINT
        GENERATED ALWAYS AS (CASE WHEN status <> 'CANCELLED' THEN rfq_id END) STORED,
    ADD UNIQUE KEY uq_awards_active_rfq (active_rfq_id);

COMMIT;

-- Check: should list the new columns and uq_awards_active_rfq.
SHOW CREATE TABLE awards;
