import server from "../server.js";

export const mockUser = {
  name: "Ryan Brockhoff",
  email: "ryan@tidytrek.com",
  password: "ilovehiking",
};

// dummy user is not seeded into the database
export const notSeededUser = {
  name: "Sarah Collins",
  email: "scollins@tidytrek.com",
  password: "newtohiking123!",
};

export const loginMockUser = async () => {
  try {
    const agent = require("supertest").agent(server);
    await agent.post("/auth/login").send(mockUser);
    return agent;
  } catch (err) {
    return { error: "Could not register user for testing." };
  }
};
