"use strict";

require("dotenv").config({ path: "./.env.local" });

const http = require("http");
const express = require("express");
const { OpenAI } = require("openai");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

app.use(express.static(__dirname + "/views"));
app.use(express.static(__dirname + "/public"));

const io = new Server(server, {
    rejectUnauthorized: app.settings.env !== "development",
    cors: {
        origin: `http://localhost:${PORT}`,
        methods: ["GET", "POST"],
    },
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

io.on("connection", function (socket) {
    console.log("Socket connected");
});

app.get("/", async (req, res) => {
    res.sendFile("index.html");
});

io.on("connection", function (socket) {
    socket.on("chat message", async (text) => {
        console.log("Message: " + text);
        try {
            const completion = await openai.chat.completions.create({
                messages: [{ role: "system", content: text }],
                model: "gpt-3.5-turbo",
            });
            console.log(completion);

            const aiText = completion.choices[0];
            console.log("Bot reply: " + aiText);
            socket.emit("bot reply", aiText);
        } catch (error) {
            console.warn(error);
            socket.emit("bot reply", "");
        }
    });
});

server.listen(PORT, () => {
    console.log(
        "Express server listening on port %d in %s mode",
        PORT,
        app.settings.env
    );
});
