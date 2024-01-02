import server from "../server.js";

export const mockUser = {
  name: "Ryan Brockhoff",
  email: "ryan@tidytrek.com",
  password: "ilovehiking",
};

export const registerMockUser = async () => {
  try {
    const agent = require("supertest").agent(server);
    await agent.post("/auth/register").send(mockUser);
    return agent;
  } catch (err) {
    return { error: "Could not register user for testing." };
  }
};
