CREATE TABLE midtrans_payment_transactions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL UNIQUE,
    booking_id INT UNSIGNED NOT NULL,
    payment_type ENUM('DP', 'SETTLEMENT') NOT NULL,
    gross_amount INT UNSIGNED NOT NULL,
    transaction_status VARCHAR(32) NOT NULL DEFAULT 'CREATED',
    fraud_status VARCHAR(32) NULL,
    midtrans_transaction_id VARCHAR(100) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_midtrans_transactions_booking_id (booking_id),
    INDEX idx_midtrans_transactions_status (transaction_status)
);
