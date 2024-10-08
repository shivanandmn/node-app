/* --- Node.js (backend) --- */
const WebSocket = require("ws");
const http = require("http");
const express = require("express");
const path = require("path");

const app = express();
const server = http.createServer(app);

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, "public")));

// Create WebSocket server
const wss = new WebSocket.Server({ server });

const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";

wss.on("connection", (clientSocket) => {
    console.log("Client connected");

    // Establish WebSocket connection to the Realtime API
    let apiSocket;
    try {
        apiSocket = new WebSocket(url, {
            headers: {
                "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
                "OpenAI-Beta": "realtime=v1",
            },
        });
    } catch (error) {
        console.error("Failed to connect to Realtime API:", error);
        clientSocket.close();
        return;
    }

    apiSocket.on("open", () => {
        console.log("Connected to Realtime API");
    });

    apiSocket.on("error", (error) => {
        console.error("Realtime API connection error:", error);
        clientSocket.close();
    });

    // Relay messages from client to Realtime API
    clientSocket.on("message", (message) => {
        if (apiSocket && apiSocket.readyState === WebSocket.OPEN) {
            apiSocket.send(message);
        } else {
            console.error("Cannot send message, Realtime API socket is not open");
        }
    });

    // Relay messages from Realtime API to client
    apiSocket.on("message", (message) => {
        if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(message);
        }
    });

    // Handle connection closures
    clientSocket.on("close", () => {
        console.log("Client disconnected");
        if (apiSocket) apiSocket.close();
    });

    apiSocket.on("close", () => {
        console.log("Realtime API connection closed");
        if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.close();
        }
    });
});

server.listen(3000, () => {
    console.log("Server is listening on port 3000");
});