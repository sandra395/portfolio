const request = require("supertest");
const app = require("../app");

describe("GET /api/properties", () => {
  test("responds with status 200", async () => {
    await request(app).get("/api/properties").expect(200);
  });

  test("responds with an array of properties with required fields", async () => {
    const { body } = await request(app).get("/api/properties");

    expect(Array.isArray(body.properties)).toBe(true);
    expect(body.properties.length).toBeGreaterThan(0);

    body.properties.forEach(property => {
      expect(property).toHaveProperty("property_id");
      expect(property).toHaveProperty("property_name");
      expect(property).toHaveProperty("location");
      expect(property).toHaveProperty("price_per_night");
      expect(property).toHaveProperty("host");
    });
  });

  test("non-existent path responds with 404 and a message", async () => {
    const { body } = await request(app).get("/non-existent-path").expect(404);
    expect(body.msg).toBe("Path not found");
  });

  describe("Price filter tests", () => {
    test("returns 404 when no properties match price range", async () => {
      const res = await request(app)
        .get("/api/properties?minprice=1000&maxprice=2000")
        .expect(404);
      expect(res.body.msg).toBe("No properties found with the provided criteria.");
    });

    test("all returned properties cost at least the minimum price", async () => {
      const minPrice = 50;
      const { body } = await request(app).get(`/api/properties?minprice=${minPrice}`).expect(200);
      expect(Array.isArray(body.properties)).toBe(true);
      body.properties.forEach(property => {
        expect(Number(property.price_per_night)).toBeGreaterThanOrEqual(minPrice);
      });
    });

    test("returns 400 if minprice or maxprice are not numbers", async () => {
      const { body } = await request(app)
        .get("/api/properties?minprice=abc&maxprice=100")
        .expect(400);
      expect(body.msg).toBe("Please use numbers for minprice and maxprice");
    });
  });

  describe("Property type filter tests", () => {
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

    test("returns 404 if property_type does not exist", async () => {
      const { body } = await request(app)
        .get("/api/properties?property_type=invalid_property_type")
        .expect(404);
      expect(body.msg).toBe("property_type not found");
    });
  });

  describe("Sorting tests", () => {
    test("returns all properties if no sort or order given", async () => {
      const { body } = await request(app).get("/api/properties").expect(200);
      expect(Array.isArray(body.properties)).toBe(true);
      expect(body.properties[0]).toHaveProperty("cost_per_night");
      expect(body.properties[0]).toHaveProperty("popularity");
    });

    test("returns properties sorted by cost_per_night ascending", async () => {
      const { body } = await request(app)
        .get("/api/properties?sort=cost_per_night&order=ascending")
        .expect(200);
      expect(body.properties[0].cost_per_night).toBeLessThanOrEqual(body.properties[1].cost_per_night);
    });

    test("returns properties sorted by popularity descending", async () => {
      const { body } = await request(app)
        .get("/api/properties?sort=popularity&order=descending")
        .expect(200);
      expect(body.properties[0].popularity).toBeGreaterThanOrEqual(body.properties[1].popularity);
    });

    test("returns 404 with message if no properties found with filters", async () => {
      const res = await request(app)
        .get("/api/properties")
        .query({ minprice: '999999', maxprice: '1000000' })
        .expect(404);

      expect(res.body).toEqual({
        msg: "No properties found with the provided criteria."
      });
    });
  });
});

//6 
//describe("GET /api/properties/:id", () => {
    //test("a get request to /api/properties responds with status of 200", async () => {
