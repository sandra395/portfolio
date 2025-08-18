// Bring in supertest to send HTTP requests to our app
const request = require("supertest");
// Import Express app
const app = require("../app");
const db = require("../db/connection");

//Tests for GET /api/properties
describe("GET /api/properties", () => {
  test("responds with status 200", async () => {
    await request(app).get("/api/properties").expect(200);
  });

  test("responds with an array of properties with required fields", async () => {
    const { body } = await request(app).get("/api/properties");

    // Check that body.properties is an array and not empty
    expect(Array.isArray(body.properties)).toBe(true);
    expect(body.properties.length).toBeGreaterThan(0);

    // Check each property has the expected fields
    body.properties.forEach(property => {
      expect(property).toHaveProperty("property_id");
      expect(property).toHaveProperty("property_name");
      expect(property).toHaveProperty("location");
      expect(property).toHaveProperty("price_per_night");
      expect(property).toHaveProperty("host");
    });
  });

    // Tests for price filtes
  describe("Price filter tests", () => {
    // Test that high-priced properties don’t exist
    test("returns 200 and empty array when no properties match price range", async () => {
      const res = await request(app)
        .get("/api/properties?minprice=1000&maxprice=2000")
        .expect(200);
        expect(res.body).toEqual({ properties: [] });
    });

     // Test min price filter
    test("all returned properties cost at least the minimum price", async () => {
      const minPrice = 50;
      const { body } = await request(app).get(`/api/properties?minprice=${minPrice}`).expect(200);
      expect(Array.isArray(body.properties)).toBe(true);
      body.properties.forEach(property => {
        expect(Number(property.price_per_night)).toBeGreaterThanOrEqual(minPrice);
      });
    });

// Test invalid price input returns 400
    test("returns 400 if minprice or maxprice are not numbers", async () => {
      const { body } = await request(app)
        .get("/api/properties?minprice=abc&maxprice=100")
        .expect(400);
      expect(body.msg).toBe("Please use numbers for minprice and maxprice");
    });
  });

  // Test for property type filter
  describe("Property type filter tests", () => {
    // Filter properties by type
    test("filters properties by property_type", async () => {
      const { body } = await request(app)
        .get("/api/properties?property_type=Apartment")
        .expect(200);

      expect(Array.isArray(body.properties)).toBe(true);
      expect(body.properties.length).toBeGreaterThan(0);

      body.properties.forEach(property => {
        expect(property.property_type).toBe("Apartment");
      });
    });

    //Return 404 if property type doesn't exist
    test("returns 404 if property_type does not exist", async () => {
      const { body } = await request(app)
        .get("/api/properties?property_type=invalid_property_type")
        .expect(404);
      expect(body.msg).toBe("property_type not found");
    });
  });

  // Tests for sorting
  describe("Sorting tests", () => {
    //Invalid sort field
    test("responds with 400 Bad Request when sort field is invalid", async () => {
      await request(app)
        .get("/api/properties?sort=invalidField&order=ascending")
        .expect(400);
    });

    // Invalid order value
    test("responds with 400 Bad Request when order value is invalid", async () => {
      await request(app)
        .get("/api/properties?sort=cost_per_night&order=invalidOrder")
        .expect(400);
    });

  });
});
// Test non-existent path returns 404
test("non-existent path responds with 404 and a message", async () => {
  const { body } = await request(app).get("/non-existent-path").expect(404);
  expect(body.msg).toBe("Path not found");
});


// Tests for GET /api/properties/:id
describe("GET /api/properties/:id", () => {
    test("It shows property details when the property ID is correct", async () => {
      const propertyId = 3;
      const res = await request(app).get(`/api/properties/${propertyId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.property).toHaveProperty('property_id', propertyId);
      expect(res.body.property).toHaveProperty('property_name');
      expect(res.body.property).toHaveProperty('location');
      expect(res.body.property).toHaveProperty('price_per_night');
      expect(res.body.property).toHaveProperty('description');
      expect(res.body.property).toHaveProperty('host');
      expect(res.body.property).toHaveProperty('host_avatar');
      expect(res.body.property).toHaveProperty('favourite_count');
      expect(res.body.property).not.toHaveProperty('favourited');
    });

    test("It shows property details without favourited when no user_id given", async () => {
      const res = await request(app).get("/api/properties/1").expect(200);
    
      expect(res.body.property).toHaveProperty('host_avatar');
      expect(res.body.property).toHaveProperty('favourite_count');
// Check that 'favourited' is false or not present when no user_id is given
      expect(res.body.property.favourited === undefined || res.body.property.favourited === false).toBe(true);
    });
    
    test("should return 404 if property ID does not exist", async () => {
      const idNotExist = 10105;
    
      const { body } = await request(app)
        .get(`/api/properties/${idNotExist}`)
        .expect(404);
    
      expect(body.msg).toBe("Property not found");
    });
  });

// Tests for POST /api/properties/:id/reviews
    describe("POST /api/properties/:id/reviews", () => {
      const propertyId = 5;
    
      test("adds a new review and returns it with status 201", async () => {
        const reviewData = {
          guest_id: 1,
          rating: 5,
          comment: "Great place to stay!"
        };
    
        const response = await request(app)
          .post(`/api/properties/${propertyId}/reviews`)
          .send(reviewData)
          .expect(201);

      // Check returned review
        expect(response.body).toHaveProperty('review_id');
        expect(response.body.property_id).toBe(propertyId);
        expect(response.body.guest_id).toBe(reviewData.guest_id);
        expect(response.body.rating).toBe(reviewData.rating);
        expect(response.body.comment).toBe(reviewData.comment);
    
        //Check created_at is valid date
        const createdAt = new Date(response.body.created_at);
        expect(createdAt.toString()).not.toBe("Invalid Date");
      });
    
      test("status 400: responds with bad request message for missing rating", async () => {
        const invalidData = { guest_id: 2, comment: "Missing rating" };
    
        const { body } = await request(app)
          .post(`/api/properties/${propertyId}/reviews`)
          .send(invalidData)
          .expect(400);
    
        expect(body.msg).toBe("rating is required");
      });
    });

  
    // Tests for /api/users/:id
    describe("GET /api/users/:id", () => {
        test("returns user info with status 200 if user exists", async () => {
            // If user exists, return their info
          const res = await request(app).get("/api/users/1").expect(200);
          expect(res.body.user).toHaveProperty("email");
        });
        // If no ID is given, return 404
        test("404: returns 'Path not found' when no user ID is given in the URL", async () => {
          const res = await request(app).get("/api/users/").expect(404);
          expect(res.body.msg).toBe("Path not found");
        });
      });
      
      // Tests for GET /api/properties/:property_id/reviews
        // Returns reviews array and average rating
      describe("GET /api/properties/:property_id/reviews", () => {
        test("200: responds with an array of reviews and average_rating", async () => {
          const propertyId = 5; 
          const { body } = await request(app)
            .get(`/api/properties/${propertyId}/reviews`)
            .expect(200);
      
          expect(Array.isArray(body.reviews)).toBe(true);
          expect(typeof body.average_rating).toBe("number");
      
          body.reviews.forEach((review) => {
            expect(review).toHaveProperty("review_id");
            expect(review).toHaveProperty("comment");
            expect(review).toHaveProperty("rating");
            expect(review).toHaveProperty("created_at");
            expect(review).toHaveProperty("guest");
            expect(review).toHaveProperty("guest_avatar");
          });
        });
          // Reviews should be sorted newest first
          test("reviews are sorted from newest to oldest", async () => {
            const { body } = await request(app)
              .get("/api/properties/1/reviews")
              .expect(200);
          
            expect(body.reviews).toBeSortedBy("created_at", { descending: true });
          });
          // Invalid property ID returns 400
          test("400 when property ID is not a number", async () => {
            const { body } = await request(app)
              .get("/api/properties/not-a-number/reviews")
              .expect(400);
          
            expect(body.msg).toBe("Invalid property ID");
          });
      });
  
// Tests for DELETE /api/reviews/:id
      describe("DELETE /api/reviews/:id", () => {
       let reviewId;
     // Before tests, add a review to delete
  beforeAll(async () => {
    const result = await db.query(
      `INSERT INTO reviews (property_id, guest_id, rating, comment, created_at)
       VALUES (1, 1, 5, 'This is a test review', NOW())
       RETURNING review_id`
    );
    reviewId = result.rows[0].review_id;
  });

// Remove test data and close the database
  afterAll(async () => {
    await db.query(`DELETE FROM reviews WHERE review_id = $1`, [reviewId]);
    await db.end();
  });

  // Delete review successfully
  test("Should delete review and respond with status 204 and no content", async () => {
    const response = await request(app).delete(`/api/reviews/${reviewId}`);
    expect(response.status).toBe(204);
    expect(response.body).toEqual({}); // No response body

    // Confirm review is gone in database
    const check = await db.query(`SELECT * FROM reviews WHERE review_id = $1`, [reviewId]);
    expect(check.rows.length).toBe(0);
  });

// Test error when the review is not found
  describe("Error cases", () => {
  // Try to delete a review that does not exist
    test("Should return 404 if review ID does not exist", async () => {
      const response = await request(app).delete(`/api/reviews/999999`);
      expect(response.status).toBe(404);
      expect(response.body.msg).toBe("no body");
    });
  });
});

// Try deleting without giving a review ID
test("Returns 400 for missing review ID", async () => {
 // Express usually won’t match this URL without an ID at the end
  const res = await request(app).delete("/api/reviews/");
  expect(res.status).toBe(404); 
});