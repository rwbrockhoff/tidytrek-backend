const server = require("./server");
const port = process.env.PORT;

server.get("/", (req, res) => {
  res.status(200).send("Server is up and running.");
});

server.listen(port, () => console.log(`Listening on ${port}`));
