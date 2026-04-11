process.env.JWT_SECRET = "test-jwt-secret";
process.env.SESSION_SECRET = "test-session-secret";

jest.mock("../src/models/recordModel", () => ({
  getRecordsCollection: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const request = require("supertest");
const { ObjectId } = require("mongodb");

const { getRecordsCollection } = require("../src/models/recordModel");
const app = require("../src/app");

const buildToken = (userId = new ObjectId().toString()) =>
  jwt.sign({ userId, email: "tester@example.com" }, process.env.JWT_SECRET);

describe("Records GET routes", () => {
  test("GET /records returns records for authenticated user", async () => {
    const userId = new ObjectId().toString();

    const collection = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([
            {
              _id: new ObjectId(),
              userId: new ObjectId(userId),
              habitId: new ObjectId(),
              date: "2026-04-10",
              completed: true,
            },
          ]),
        }),
      }),
    };

    getRecordsCollection.mockReturnValue(collection);

    const response = await request(app)
      .get("/records")
      .set("Authorization", `Bearer ${buildToken(userId)}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].completed).toBe(true);
  });

  test("GET /records/:recordId returns one record", async () => {
    const userId = new ObjectId().toString();
    const recordId = new ObjectId().toString();

    const collection = {
      findOne: jest.fn().mockResolvedValue({
        _id: new ObjectId(recordId),
        userId: new ObjectId(userId),
        habitId: new ObjectId(),
        date: "2026-04-10",
        completed: false,
      }),
    };

    getRecordsCollection.mockReturnValue(collection);

    const response = await request(app)
      .get(`/records/${recordId}`)
      .set("Authorization", `Bearer ${buildToken(userId)}`);

    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(recordId);
    expect(response.body.completed).toBe(false);
  });
});
