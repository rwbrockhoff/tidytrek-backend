import server from "../../server.js";
import initialRequest from "supertest";
const request = initialRequest(server);
import knex from "../../db/connection.js";
import { registerMockUser, mockUser } from "../../utils/testUtils.js";

beforeEach(async () => {
  await knex.migrate.rollback();
  await knex.migrate.latest();
});

afterAll(async () => {
  await knex.migrate.rollback().then(() => knex.destroy());
});

describe("Auth Routes: ", () => {
  describe("GET /status: ", () => {
    it("Should get auth status", async () => {
      const response = await request.get("/auth/status").send();
      expect(response.statusCode).toEqual(200);
    });
  });

  describe("POST /register: ", () => {
    it("Should register new user", async () => {
      const response = await request.post("/auth/register").send(mockUser);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toHaveProperty("user");
    });
  });

  describe("POST /login: ", () => {
    it("Should allow registered users to log in", async () => {
      const user = await registerMockUser();
      const response = await user.post("/auth/login").send(mockUser);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toHaveProperty("user");
    });
  });
  describe("POST /logout: ", () => {
    it("Should allow user to logout", async () => {
      const user = await registerMockUser();
      const response = await user.post("/auth/logout");
      expect(response.statusCode).toEqual(200);
      expect(response.body).toHaveProperty("message");
    });
  });
  describe("POST /register: ", () => {
    it("Should NOT allow existing user to register", async () => {
      const user = await registerMockUser();
      const response = await user.post("/auth/register").send(mockUser);
      expect(response.statusCode).toEqual(409);
      expect(response.body).toHaveProperty("error");
    });
  });
  describe("POST /login: ", () => {
    it("Should NOT allow wrong password", async () => {
      const user = await registerMockUser();
      const mockUserBadPassword = {
        email: mockUser.email,
        password: "wrongpassword",
      };
      const response = await user.post("/auth/login").send(mockUserBadPassword);
      expect(response.statusCode).toEqual(400);
      expect(response.body).toHaveProperty("error");
    });
  });
});
