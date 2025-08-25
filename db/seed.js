const db = require("./connection");
const format = require("pg-format");

async function seed(propertyTypesData,usersData, propertiesData, reviewsData, 
  imagesData, favouritesData, bookingsData) {
    await db.query(`DROP TABLE IF EXISTS properties_amenities`);
await db.query(`DROP TABLE IF EXISTS reviews`);
await db.query(`DROP TABLE IF EXISTS images`);
await db.query(`DROP TABLE IF EXISTS favourites`);
await db.query(`DROP TABLE IF EXISTS bookings`);
await db.query(`DROP TABLE IF EXISTS properties`);
await db.query(`DROP TABLE IF EXISTS amenities`);
await db.query(`DROP TABLE IF EXISTS users`);
await db.query(`DROP TABLE IF EXISTS property_types`);

    
  //CREATE TABLES
  await db.query(`
    CREATE TABLE property_types (
      property_type VARCHAR(40) NOT NULL,
      description TEXT NOT NULL
    )
  `);

  await db.query(`
    CREATE TABLE users (
      user_id SERIAL PRIMARY KEY,
      first_name VARCHAR NOT NULL,
      surname VARCHAR NOT NULL,
      email VARCHAR NOT NULL,
      phone_number VARCHAR,
      is_host BOOLEAN NOT NULL,
      avatar VARCHAR,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE properties (
      property_id SERIAL PRIMARY KEY,
      host_id INT NOT NULL,
      name VARCHAR NOT NULL,
      location VARCHAR NOT NULL,
      property_type VARCHAR NOT NULL,
      price_per_night DECIMAL NOT NULL,
      description TEXT,
      FOREIGN KEY (host_id) REFERENCES users(user_id)
    )
  `);




  await db.query(`
    CREATE TABLE reviews (
      review_id SERIAL PRIMARY KEY,
      property_id INT NOT NULL REFERENCES properties(property_id),
      guest_id INT NOT NULL REFERENCES users(user_id),
      rating INT NOT NULL,
      comment TEXT,
     created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE images (
     image_id SERIAL PRIMARY KEY,
     property_id INT NOT NULL,
     image_url VARCHAR NOT NULL,
     alt_text VARCHAR NOT NULL 
    )
  `);

  await db.query(`
    CREATE TABLE favourites (
     favourite_id SERIAL PRIMARY KEY,
    guest_id INT NOT NULL REFERENCES users(user_id),
    property_id INT REFERENCES properties(property_id)
    )
  `);

  await db.query(`
    CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    property_id INT NOT NULL REFERENCES properties(property_id),
    guest_id INT NULL REFERENCES users(user_id),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.query(`
    CREATE TABLE amenities (
      amenity_slug VARCHAR PRIMARY KEY
    );
  `);
  
  await db.query(`
    CREATE TABLE properties_amenities (
      properties_amenity SERIAL PRIMARY KEY,
      property_id INT NOT NULL,
      amenity_slug VARCHAR NOT NULL,
      CONSTRAINT property_fk FOREIGN KEY (property_id) REFERENCES properties(property_id),
      CONSTRAINT amenity_fk FOREIGN KEY (amenity_slug) REFERENCES amenities(amenity_slug) 
    );
  `);
  

// Extracts property type and description from each object, 
// creating an array of [property_type, description] pairs.
  const formattedPropertyTypesData = propertyTypesData.map(
    ({ property_type, description }) => [property_type, description]
  );

  const insertPropertyTypesQuery = format(
    `INSERT INTO property_types (property_type, description) VALUES %L RETURNING *`,
    formattedPropertyTypesData
  );

  const { rows: propertyTypeRows } = await db.query(insertPropertyTypesQuery);
  //console.log("Inserted property types:", propertyTypeRows);

  // Maps over usersData to create an array of user details, 
// ensuring created_at has a value by defaulting to the current date if missing.
  const formattedUsersData = usersData.map(
    ({
      first_name,
      surname,
      email,
      phone_number,
      is_host,
      avatar,
      created_at,
    }) => [
      first_name,
      surname,
      email,
      phone_number,
      is_host,
      avatar,
      created_at || new Date(),
    ]
  );

  // Insert many users into the database and get the inserted user records.
  const insertUsersQuery = format(
    `INSERT INTO users (first_name, surname, email, phone_number, is_host, avatar, created_at) VALUES %L RETURNING *`,
    formattedUsersData
  );
  const { rows: userRows } = await db.query(insertUsersQuery);

  //Make a list to find a user’s ID by their full name
  const usersRef = {};
  userRows.forEach((user) => {
    const fullName = `${user.first_name} ${user.surname}`;
    usersRef[fullName] = user.user_id;
  });

  // Change each property’s host name to the host’s user ID.
// If no user is found for the host name, show an error
  const formattedPropertiesData = propertiesData.map((property) => {
    const host_id = usersRef[property.host_name];
    if (!host_id) {
      throw new Error(`No user found for host_name: ${property.host_name}`);
    }
    return [
      host_id,
      property.name,
      property.location,
      property.property_type,
      property.price_per_night,
      property.description,
    ];
  });

  const insertPropertiesQuery = format(
    `INSERT INTO properties (host_id, name, location, property_type, price_per_night, description) VALUES %L RETURNING *`,
    formattedPropertiesData
  );
  const { rows: propertiesRows } = await db.query(insertPropertiesQuery);
  //console.log("Inserted properties:", propertiesRows);

  // This is new code you need to add after your `properties` table insert query
// const { rows: propertiesRows } = await db.query(insertPropertiesQuery);

// Extract all unique amenities from the properties data
const uniqueAmenities = new Set();
propertiesData.forEach(property => {
    if (property.amenities) {
        property.amenities.forEach(amenity => {
            uniqueAmenities.add(amenity);
        });
    }
});

// Format and insert the unique amenities
const formattedAmenitiesData = [...uniqueAmenities].map(amenity_slug => [amenity_slug]);
const insertAmenitiesQuery = format(
    `INSERT INTO amenities (amenity_slug) VALUES %L RETURNING *`,
    formattedAmenitiesData
);
await db.query(insertAmenitiesQuery);

// Create and insert properties_amenities data
const formattedPropertiesAmenitiesData = [];
propertiesRows.forEach(property => {
    const originalProperty = propertiesData.find(p => p.name === property.name);
    if (originalProperty && originalProperty.amenities) {
        originalProperty.amenities.forEach(amenity => {
            formattedPropertiesAmenitiesData.push([property.property_id, amenity]);
        });
    }
});

if (formattedPropertiesAmenitiesData.length > 0) {
    const insertPropertiesAmenitiesQuery = format(
        `INSERT INTO properties_amenities (property_id, amenity_slug) VALUES %L RETURNING *`,
        formattedPropertiesAmenitiesData
    );
    await db.query(insertPropertiesAmenitiesQuery);
}

// Make a list to find a property’s ID by its name
  const propertiesRef = {};
  propertiesRows.forEach((property) => {
    propertiesRef[property.name] = property.property_id;
  });


  //For each review, find the property ID and guest ID using their names.
  // If either ID is missing, skip that review and show a warning.
  // Return a list of review data with IDs and other details.
  const formattedReviewsData = reviewsData
    .map(({ property_name, guest_name, rating, comment, created_at }) => {
      const property_id = propertiesRef[property_name];
      if (!property_id) {
        console.warn(
          `Warning: No property_id found for property_name: ${property_name}, skipping this review.`
        );
        return null;
      }
      const guest_id = usersRef[guest_name];
      if (!guest_id) {
        console.warn(
          `Warning: No user_id found for guest_name: ${guest_name}, skipping this review.`
        );
        return null;
      }
      return [
        property_id,
        guest_id,
        rating,
        comment,
        created_at || new Date(),
      ];
    })
    .filter(Boolean);

    const insertReviewsQuery = format(
      `INSERT INTO reviews (property_id, guest_id, rating, comment, created_at) VALUES %L RETURNING *`,
      formattedReviewsData
    );

  const { rows: ReviewsRows } = await db.query(insertReviewsQuery);
  //console.log("Inserted reviews:", ReviewsRows);

// For each image, find the property ID by name.
// If no ID is found, show an error.
    const formattedImagesData = imagesData.map(({ property_name, image_url, alt_text }) => {
      const property_id = propertiesRef[property_name];
      if (!property_id) {
        throw new Error(`No property_id found for property_name: ${property_name}`);
      }
      return [
        property_id,
        image_url,
        alt_text || "Image"  // If alt_text is missing, empty, or false, use the word "Image" instead as a default.
      ];
    });
    
    const insertImagesQuery = format(
      `INSERT INTO images (property_id, image_url, alt_text) VALUES %L RETURNING *`,
      formattedImagesData
    );

    const { rows: ImagesRows } = await db.query(insertImagesQuery);
  //console.log("Inserted images:", ImagesRows);

    // For each favourite, find the guest ID and property ID using their names.
    const formattedFavouritesData = favouritesData
  .map(({ guest_name, property_name }) => {
    const guest_id = usersRef[guest_name];
    const property_id = propertiesRef[property_name];

// Skip favourites if the guest or property ID is missing,
// show a warning, and only keep valid favorites.
    if (!guest_id) {
      //console.warn(`No user_id found for guest_name: ${guest_name}, skipping favourite.`);
      return null;
    }
    if (!property_id) {
      //console.warn(`No property_id found for property_name: ${property_name}, skipping favourite.`);
      return null;
    }

    return [guest_id, property_id];
  })
  .filter(Boolean);

  const insertFavouritesQuery = format(
    `INSERT INTO favourites (guest_id, property_id) VALUES %L RETURNING *`,
    formattedFavouritesData
  );

  const { rows: FavouriteRows } = await db.query(insertFavouritesQuery);
  //console.log("Inserted favourites:", FavouriteRows);

 // For each booking, find the property ID by name.
// If no ID is found, show a warning and skip that booking.
  const formattedBookingsData = bookingsData
  .map(({ property_name, guest_name, check_in_date, check_out_date, created_at }) => {
    const property_id = propertiesRef[property_name];
    if (!property_id) {
      //console.warn(`No property_id found for property_name: ${property_name}, skipping booking.`);
      return null;
    }

// Find the guest ID by name, skip booking if not found.
// Return booking details with IDs and dates, 
// using current date if created_at is missing.
// Remove any skipped bookings from the list.
    const guest_id = usersRef[guest_name];
    if (!guest_id) {
      //console.warn(`No user_id found for guest_name: ${guest_name}, skipping booking.`);
      return null;
    }

    return [
      property_id,
      guest_id,
      check_in_date,
      check_out_date,
      created_at || new Date(),
    ];
  })
  .filter(Boolean);

// If there are bookings to add, insert them into the database and show the added bookings.
// Otherwise, say there are no bookings to add.
  if (formattedBookingsData.length > 0) {
    const insertBookingsQuery = format(
      `INSERT INTO bookings (property_id, guest_id, check_in_date, check_out_date, created_at) VALUES %L RETURNING *`,
      formattedBookingsData
    );
    const { rows: BookingsRows } = await db.query(insertBookingsQuery);
    //console.log("Inserted bookings:", BookingsRows);
  } else {
    //console.log("No bookings data to insert");
  }




  

  //const { rows: allPropertyTypes } = await db.query(`SELECT * FROM property_types`);
  //console.log("All property_types in DB:", allPropertyTypes); //print all the rows from each table after inserting data.
}



module.exports = seed;