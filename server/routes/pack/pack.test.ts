import server from "../../server.js";
import initialRequest from "supertest";
const request = initialRequest(server);
import knex from "../../db/connection.js";
import { registerMockUser } from "../../utils/testUtils.js";

beforeEach(async () => {
  await knex.migrate.rollback();
  await knex.migrate.latest();
});

afterAll(async () => {
  await knex.migrate.rollback().then(() => knex.destroy());
});

describe("Pack Routes: ", () => {
  describe("GET /: ", () => {
    it("Should get default pack", async () => {
      const agent = await registerMockUser();
      const response = await agent.get("/packs/").send();
      expect(response.statusCode).toEqual(200);
    });
  });
});
