const userRoutes = require("../routes/user/userRoutes");
const authenticationRoutes = require("../routes/authentication/authenticationRoutes");
const { protectedRoute } = require("../utils/customMiddleware");

const routeConfig = (app) => {
  app.use("/auth", authenticationRoutes);
  app.use("/user", protectedRoute, userRoutes);
};

module.exports = routeConfig;
