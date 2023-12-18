const userRoutes = require("../routes/user/userRoutes");
const authenticationRoutes = require("../routes/authentication/authenticationRoutes");

const routeConfig = (app) => {
  app.use("/auth", authenticationRoutes);
  app.use("/user", userRoutes);
};

module.exports = routeConfig;
