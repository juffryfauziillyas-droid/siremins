ALTER TABLE bookings
    ADD COLUMN user_id INT UNSIGNED NULL AFTER id;

UPDATE bookings AS booking
JOIN (
    SELECT phone_number, MIN(id) AS user_id
    FROM users
    WHERE role = 'CUSTOMER'
    GROUP BY phone_number
    HAVING COUNT(*) = 1
) AS customer ON customer.phone_number = booking.phone_number
SET booking.user_id = customer.user_id
WHERE booking.user_id IS NULL;

CREATE INDEX idx_bookings_user_id ON bookings (user_id);
