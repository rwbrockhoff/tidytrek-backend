import server from "../server.js";

const mockUser = {
  name: "Jim Halpert",
  email: "jhalpert@dundermifflin.com",
  password: "ilovepaper",
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
