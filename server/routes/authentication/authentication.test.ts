import server from "../../server.js";
import initialRequest from "supertest";
const request = initialRequest(server);
import knex from "../../db/connection.js";
import {
  loginMockUser,
  mockUser,
  notSeededUser,
} from "../../utils/testUtils.js";

beforeEach(async () => {
  await knex.migrate.rollback();
  await knex.migrate.latest();
  await knex.seed.run();
});

afterAll(async () => {
  await knex.migrate.rollback().then(() => knex.destroy());
});

describe("Auth Routes: ", () => {
  it("GET /status -> Should get auth status", async () => {
    const response = await request.get("/auth/status").send();
    expect(response.statusCode).toEqual(200);
  });

  it("POST /register -> Should register new user", async () => {
    const response = await request.post("/auth/register").send(notSeededUser);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty("user");
  });

  it("POST /register -> Should NOT allow existing user to register", async () => {
    const user = await loginMockUser();
    const response = await user.post("/auth/register").send(mockUser);
    expect(response.statusCode).toEqual(409);
    expect(response.body).toHaveProperty("error");
  });

  it("POST /login -> Should allow registered users to log in", async () => {
    const user = await loginMockUser();
    const response = await user.post("/auth/login").send(mockUser);
    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty("user");
  });

  it("POST /login -> Should NOT allow wrong password", async () => {
    const user = await loginMockUser();
    const mockUserBadPassword = {
      email: mockUser.email,
      password: "wrongpassword",
    };
    const response = await user.post("/auth/login").send(mockUserBadPassword);
    expect(response.statusCode).toEqual(400);
    expect(response.body).toHaveProperty("error");
  });

  it("POST /logout -> Should allow user to logout", async () => {
    const user = await loginMockUser();
    const response = await user.post("/auth/logout");
    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty("message");
  });
});
