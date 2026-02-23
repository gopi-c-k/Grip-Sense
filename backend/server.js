const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();
const axios = require("axios");

// Temporary storage
let emergencyPhone = null;
let lastLocation = null;

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

    socket.on("esp32-data", async (data) => {
        io.to("app").emit("app-data", data);

        if (data.riskLevel === "CRITICAL") {

            if (emergencyPhone && lastLocation) {

                const { lat, lng } = lastLocation;
                const link = `https://maps.google.com/?q=${lat},${lng}`;

                await sendSMS(emergencyPhone, link);

            } else {
                console.log("Missing phone or location");
            }
        }
    });

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


// SMS Function
async function sendSMS(number, locationLink) {
    console.log("Sending SMS to:", number, "with location:", locationLink);
    try {
        await axios.get("https://www.fast2sms.com/dev/bulkV2", {
            params: {
                authorization: process.env.FAST2SMS_API_KEY,
                route: "q",
                message: `🚨 FALL DETECTED!\nLocation: ${locationLink}`,
                language: "english",
                numbers: number,
            },
        });

        console.log("SMS Sent");
    } catch (err) {
        console.log("SMS Error:", err.message);
    }
}

app.post("/set-phone", (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ message: "Phone required" });
    }

    emergencyPhone = phone;

    console.log("Emergency phone saved:", phone);

    res.json({ success: true });
});

app.post("/update-location", (req, res) => {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
        return res.status(400).json({ message: "Location required" });
    }

    lastLocation = { lat, lng };

    console.log("Location updated:", lastLocation);

    res.json({ success: true });
});