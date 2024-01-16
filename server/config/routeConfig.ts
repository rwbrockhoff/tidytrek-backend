import authenticationRoutes from "../routes/authentication/authenticationRoutes.js";
import packRoutes from "../routes/pack/packRoutes.js";
import { protectedRoute } from "../utils/customMiddleware.js";

const routeConfig = (app) => {
  app.use("/auth", authenticationRoutes);
  app.use("/packs", protectedRoute, packRoutes);
};

export default routeConfig;
