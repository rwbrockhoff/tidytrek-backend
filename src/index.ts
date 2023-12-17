import server from "./server.js";

const port = 4001;

server.get("/", (req, res) => {
  res.status(200).send("Server is up and running.");
});

server.listen(port, () => console.log(`Listening on ${port}`));
