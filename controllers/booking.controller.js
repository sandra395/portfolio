const { checkExists } = require("../utils");
const { fetchBookingsByProperty, checkBookingClash, createBooking, fetchBookingsByUser } = require("../models/booking.models");


 //GET /api/properties/:id/bookings
// Returns all bookings for a property
 
const getBookingsByProperty = async (req, res, next) => {
  const property_id = req.params.id;
  if (!property_id || isNaN(property_id)) return res.status(400).json({ msg: "Invalid property ID" });

  try {
    await checkExists("properties", "property_id", property_id);
    const bookings = await fetchBookingsByProperty(property_id);

    res.status(200).json({
      property_id: Number(property_id),
      bookings: bookings.map(b => ({
        booking_id: b.booking_id,
        check_in_date: b.check_in_date,
        check_out_date: b.check_out_date,
        created_at: b.created_at
      }))
    });
  } catch (err) {
    next(err);
  }
};


 //POST /api/properties/:id/booking
 //Creates a new booking if no date clashes
 
const addBooking = async (req, res, next) => {
  const property_id = req.params.id;
  const { guest_id, check_in_date, check_out_date } = req.body;
  if (!property_id || isNaN(property_id)) return res.status(400).json({ msg: "Invalid property ID" });
  if (!guest_id || !check_in_date || !check_out_date) return res.status(400).json({ msg: "Missing required fields" });

  try {
    await checkExists("properties", "property_id", property_id);
    await checkExists("users", "user_id", guest_id);

    const clash = await checkBookingClash({ property_id, check_in_date, check_out_date });
    if (clash) return res.status(400).json({ msg: "Booking dates clash with an existing booking" });

    const newBooking = await createBooking({ property_id, guest_id, check_in_date, check_out_date });
    res.status(201).json({ msg: "Booking successful", booking_id: newBooking.booking_id });
  } catch (err) {
    next(err);
  }
};
const getBookingsByUser = async (req, res, next) => {
  const user_id = req.params.id;

  if (!user_id || isNaN(user_id)) {
    return res.status(400).json({ msg: "Invalid user ID" });
  }

  try {
    await checkExists("users", "user_id", user_id);
    const bookings = await fetchBookingsByUser(user_id);

    bookings.sort((a, b) => new Date(a.check_in_date) - new Date(b.check_in_date));

    res.status(200).json({
      bookings: bookings.map(b => ({
        booking_id: b.booking_id,
        check_in_date: b.check_in_date,
        check_out_date: b.check_out_date,
        property_id: b.property_id,
        property_name: b.property_name,
        host: b.host_name,
        image: b.property_image || null
      }))
    });
  } catch (err) {
    console.error("Error in getBookingsByUser:", err);
    next(err);
  }
};

module.exports ={
getBookingsByProperty,
addBooking,
getBookingsByUser 
};