const acceptedOrigins: string[] = [
  process.env.FRONTEND_URL,
  process.env.LANDING_PAGE_URL,
];

const corsErrorMessage: string =
  "The CORS policy of this website does not allow access from the given origin.";

module.exports = { acceptedOrigins, corsErrorMessage };
