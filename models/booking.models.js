const db = require("../db/connection");
exports.fetchBookingsByProperty = async (propertyId) => {
  const query = `
    SELECT booking_id, check_in_date, check_out_date, created_at
    FROM bookings
    WHERE property_id = $1
    ORDER BY check_out_date DESC
  `;
  const result = await db.query(query, [propertyId]);
  return result.rows;
};

// Check for overlapping bookings for a property

exports.checkBookingClash = async ({ property_id, check_in_date, check_out_date }) => {
  const query = `
    SELECT * FROM bookings
    WHERE property_id = $1
      AND check_out_date > $2
      AND check_in_date < $3
  `;
  const result = await db.query(query, [property_id, check_in_date, check_out_date]);
  return result.rows.length > 0; // true if clash exists
};

// Insert new booking

exports.createBooking = async ({ property_id, guest_id, check_in_date, check_out_date }) => {
  const query = `
    INSERT INTO bookings (property_id, guest_id, check_in_date, check_out_date, created_at)
    VALUES ($1, $2, $3, $4, NOW())
    RETURNING booking_id
  `;
  const result = await db.query(query, [property_id, guest_id, check_in_date, check_out_date]);
  return result.rows[0];
};


 //Fetch bookings for a user with property and host info
 //Sorted by check_in_date (chronological order)

exports.fetchBookingsByUser = async (user_id) => {
  const query = `
    SELECT b.booking_id, b.check_in_date, b.check_out_date,
           p.property_id, p.name AS property_name,
           u.first_name || ' ' || u.surname AS host_name,
           i.image_url AS property_image
    FROM bookings b
    JOIN properties p ON b.property_id = p.property_id
    JOIN users u ON p.host_id = u.user_id
    LEFT JOIN images i ON i.property_id = p.property_id
    WHERE b.guest_id = $1
    ORDER BY b.check_in_date ASC
  `;
  const result = await db.query(query, [user_id]);
  return result.rows;
};