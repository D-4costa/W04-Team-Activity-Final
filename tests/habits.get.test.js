process.env.JWT_SECRET = "test-jwt-secret";
process.env.SESSION_SECRET = "test-session-secret";

jest.mock("../src/models/habitModel", () => ({
  getHabitsCollection: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const request = require("supertest");
const { ObjectId } = require("mongodb");

const { getHabitsCollection } = require("../src/models/habitModel");
const app = require("../src/app");

const buildToken = (userId = new ObjectId().toString()) =>
  jwt.sign({ userId, email: "tester@example.com" }, process.env.JWT_SECRET);

describe("Habits GET routes", () => {
  test("GET /habits returns all habits for authenticated user", async () => {
    const userId = new ObjectId().toString();

    const collection = {
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            userId: new ObjectId(userId),
            title: "Read 10 pages",
            targetValue: 10,
          },
        ]),
      }),
    };

    getHabitsCollection.mockReturnValue(collection);

    const response = await request(app)
      .get("/habits")
      .set("Authorization", `Bearer ${buildToken(userId)}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe("Read 10 pages");
  });

  test("GET /habits/:habitId returns one habit", async () => {
    const userId = new ObjectId().toString();
    const habitId = new ObjectId().toString();

    const collection = {
      findOne: jest.fn().mockResolvedValue({
        _id: new ObjectId(habitId),
        userId: new ObjectId(userId),
        title: "Exercise",
        targetValue: 1,
      }),
    };

    getHabitsCollection.mockReturnValue(collection);

    const response = await request(app)
      .get(`/habits/${habitId}`)
      .set("Authorization", `Bearer ${buildToken(userId)}`);

    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(habitId);
    expect(response.body.title).toBe("Exercise");
  });
});
