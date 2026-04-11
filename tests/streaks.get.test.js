process.env.JWT_SECRET = "test-jwt-secret";
process.env.SESSION_SECRET = "test-session-secret";

jest.mock("../src/models/streakModel", () => ({
  getStreaksCollection: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const request = require("supertest");
const { ObjectId } = require("mongodb");

const { getStreaksCollection } = require("../src/models/streakModel");
const app = require("../src/app");

const buildToken = (userId = new ObjectId().toString()) =>
  jwt.sign({ userId, email: "tester@example.com" }, process.env.JWT_SECRET);

describe("Streaks GET routes", () => {
  test("GET /streaks returns streaks for authenticated user", async () => {
    const userId = new ObjectId().toString();

    const collection = {
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            userId: new ObjectId(userId),
            habitId: new ObjectId(),
            currentStreak: 3,
            longestStreak: 7,
          },
        ]),
      }),
    };

    getStreaksCollection.mockReturnValue(collection);

    const response = await request(app)
      .get("/streaks")
      .set("Authorization", `Bearer ${buildToken(userId)}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].currentStreak).toBe(3);
  });

  test("GET /streaks/:streakId returns one streak", async () => {
    const userId = new ObjectId().toString();
    const streakId = new ObjectId().toString();

    const collection = {
      findOne: jest.fn().mockResolvedValue({
        _id: new ObjectId(streakId),
        userId: new ObjectId(userId),
        habitId: new ObjectId(),
        currentStreak: 5,
        longestStreak: 9,
      }),
    };

    getStreaksCollection.mockReturnValue(collection);

    const response = await request(app)
      .get(`/streaks/${streakId}`)
      .set("Authorization", `Bearer ${buildToken(userId)}`);

    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(streakId);
    expect(response.body.longestStreak).toBe(9);
  });
});
