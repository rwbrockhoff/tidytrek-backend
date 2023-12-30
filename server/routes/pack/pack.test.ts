process.env.NODE_ENV = "test";
import server from "../../server.js";
import initialRequest from "supertest";
const request = initialRequest(server);
import knex from "../../db/connection.js";

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

describe("Pack Routes: ", () => {
  describe("GET /: ", () => {
    it("Should get default pack", async () => {
      await registerMockUser();
      const response = await request.get("/packs/").send();
      expect(response.statusCode).toEqual(200);
    });
  });
});
