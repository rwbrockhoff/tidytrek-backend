const userRoutes = require("../routes/user/userRoutes");
const authenticationRoutes = require("../routes/authentication/authenticationRoutes");
const packRoutes = require("../routes/pack/packRoutes");
const { protectedRoute } = require("../utils/customMiddleware");

const routeConfig = (app) => {
  app.use("/auth", authenticationRoutes);
  app.use("/user", protectedRoute, userRoutes);
  app.use("/pack", protectedRoute, packRoutes);
};

module.exports = routeConfig;
