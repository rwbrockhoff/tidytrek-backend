import server from "../../server.js";
import initialRequest from "supertest";
const request = initialRequest(server);
import knex from "../../db/connection.js";
import { loginMockUser } from "../../utils/testUtils.js";

beforeEach(async () => {
  await knex.migrate.rollback();
  await knex.migrate.latest();
  await knex.seed.run();
});

afterAll(async () => {
  await knex.migrate.rollback().then(() => knex.destroy());
});

describe("Pack Routes: ", () => {
  describe("GET /: ", () => {
    it("Should get default pack", async () => {
      const agent = await loginMockUser();
      const response = await agent.get("/packs/").send();
      expect(response.statusCode).toEqual(200);
    });
  });
  describe("POST /PACK/ITEM: ", () => {
    it("Should add a pack item", async () => {
      const agent = await loginMockUser();
      const response = await agent
        .post("/packs/pack-items")
        .send({ packId: 1, packCategoryId: 1 });
      expect(response.statusCode).toEqual(200);
    });
  });
});
