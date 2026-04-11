process.env.JWT_SECRET = "test-jwt-secret";
process.env.SESSION_SECRET = "test-session-secret";

jest.mock("../src/models/userModel", () => ({
  getUsersCollection: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const request = require("supertest");
const { ObjectId } = require("mongodb");

const { getUsersCollection } = require("../src/models/userModel");
const app = require("../src/app");

const buildToken = (userId = new ObjectId().toString()) =>
  jwt.sign({ userId, email: "tester@example.com" }, process.env.JWT_SECRET);

describe("Users GET routes", () => {
  test("GET /users returns all users without passwordHash", async () => {
    const collection = {
      find: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            name: "Daniela",
            email: "daniela@example.com",
            passwordHash: "hashed",
          },
        ]),
      }),
    };

    getUsersCollection.mockReturnValue(collection);

    const response = await request(app)
      .get("/users")
      .set("Authorization", `Bearer ${buildToken()}`);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].passwordHash).toBeUndefined();
  });

  test("GET /users/:userId returns one user", async () => {
    const userId = new ObjectId().toString();
    const collection = {
      findOne: jest.fn().mockResolvedValue({
        _id: new ObjectId(userId),
        name: "Ana",
        email: "ana@example.com",
        passwordHash: "hashed",
      }),
    };

    getUsersCollection.mockReturnValue(collection);

    const response = await request(app)
      .get(`/users/${userId}`)
      .set("Authorization", `Bearer ${buildToken()}`);

    expect(response.statusCode).toBe(200);
    expect(response.body._id).toBe(userId);
    expect(response.body.email).toBe("ana@example.com");
    expect(response.body.passwordHash).toBeUndefined();
  });
});
