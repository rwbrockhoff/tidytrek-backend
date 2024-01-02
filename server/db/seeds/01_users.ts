import { Knex } from "knex";
import bcrypt from "bcrypt";
import { mockUser } from "../../utils/testUtils.js";

const { name, email, password } = mockUser;
const mockUserHashedPassword = await bcrypt.hash(password, 10);

export async function seed(knex: Knex): Promise<void> {
  console.log("KNEX: ", knex);
  await knex("users").del();

  const [dummyUser] = await knex("users")
    .insert({ name, email, password: mockUserHashedPassword })
    .returning("*");

  const [secondUser] = await knex("users").insert({
    name: "Justin Hill",
    email: "jhill@tidytrek.com",
    password: mockUserHashedPassword,
  });

  console.log("DUMMY USER: ", dummyUser);
  console.log("SECOND USER: ", secondUser);
}
