process.env.NODE_ENV = "test";
const server = require("../../server");
const request = require("supertest")(server);
const knex = require("../../db/connection");

const mockUser = {
  name: "Jim Halpert",
  email: "jhalpert@dundermifflin.com",
  password: "ilovepaper",
};

const registerMockUser = async () => {
  return await request.post("/auth/register").send(mockUser);
};

beforeEach(async () => {
  await knex.migrate.rollback();
  await knex.migrate.latest();
});

afterAll(async () => {
  await knex.migrate.rollback().finally(function () {
    return knex.destroy();
  });
});

describe("Auth Routes: ", () => {
  describe("GET /STATUS: ", () => {
    it("Should get auth status", async () => {
      const response = await request.get("/auth/status").send();
      expect(response.statusCode).toEqual(200);
    });
  });

  describe("POST /REGISTER: ", () => {
    it("Should register new user", async () => {
      const response = await registerMockUser();
      expect(response.statusCode).toEqual(200);
      expect(response.body).toHaveProperty("user");
    });
  });
  describe("POST /LOGIN: ", () => {
    it("Should allow registered users to log in", async () => {
      await registerMockUser();
      const response = await request.post("/auth/login").send(mockUser);
      expect(response.statusCode).toEqual(200);
      expect(response.body).toHaveProperty("user");
    });
  });
  describe("POST /LOGOUT: ", () => {
    it("Should allow user to logout", async () => {
      await registerMockUser();
      await request.post("/auth/login").send(mockUser);
      const response = await request.post("/auth/logout");
      expect(response.statusCode).toEqual(200);
      expect(response.body).toHaveProperty("message");
    });
  });
  describe("POST /REGISTER: ", () => {
    it("Should NOT allow existing user to register", async () => {
      await registerMockUser();
      const response = await request.post("/auth/register").send(mockUser);
      expect(response.statusCode).toEqual(409);
      expect(response.body).toHaveProperty("error");
    });
  });
  describe("POST /LOGIN: ", () => {
    it("Should NOT allow wrong password", async () => {
      await registerMockUser();
      const mockUserBadPassword = {
        email: mockUser.email,
        password: "wrongpassword",
      };
      const response = await request
        .post("/auth/login")
        .send(mockUserBadPassword);
      expect(response.statusCode).toEqual(400);
      expect(response.body).toHaveProperty("error");
    });
  });
});
