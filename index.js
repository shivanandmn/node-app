/* --- Node.js (backend) --- */
import WebSocket from "ws";
import http from "http";

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";

wss.on("connection", (ws) => {
    console.log("Client connected");

    // Establish WebSocket connection to the Realtime API
    const apiSocket = new WebSocket(url, {
        headers: {
            "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
            "OpenAI-Beta": "realtime=v1",
        },
    });

    apiSocket.on("open", () => {
        console.log("Connected to Realtime API");
    });

    // Relay messages from client to Realtime API
    ws.on("message", (message) => {
        apiSocket.send(message);
    });

    // Relay messages from Realtime API to client
    apiSocket.on("message", (message) => {
        ws.send(message);
    });

    // Handle connection closures
    ws.on("close", () => {
        console.log("Client disconnected");
        apiSocket.close();
    });

    apiSocket.on("close", () => {
        console.log("Realtime API connection closed");
    });
});

server.listen(3000, () => {
    console.log("Server is listening on port 3000");
});