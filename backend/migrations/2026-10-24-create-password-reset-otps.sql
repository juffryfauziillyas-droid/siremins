CREATE TABLE password_reset_otps (
    phone_number VARCHAR(24) NOT NULL PRIMARY KEY,
    otp_hash CHAR(64) NULL,
    expires_at DATETIME NOT NULL,
    attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
    last_sent_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_password_reset_otps_expires_at (expires_at)
);
