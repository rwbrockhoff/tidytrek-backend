import userRoutes from "../routes/user/userRoutes";

const routeConfig = (app) => {
  app.use("/user", userRoutes);
};

export default routeConfig;
