const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("GripSense Backend Running");
});

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("register", (type) => {
    socket.join(type);
    console.log("Registered as:", type);
  });

  socket.on("esp32-data", (data) => {
    console.log("ESP32:", data);
    io.to("app").emit("app-data", data);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});