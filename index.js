const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app); // Create an HTTP server

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Set up a WebSocket server
const wss = new WebSocket.Server({ server });

// WebSocket connection event
wss.on('connection', (ws) => {
    console.log('New client connected!');

    // Message received from a client
    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
        // Echo the message back to the client
        ws.send(`Server received: ${message}`);
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log('Client disconnected.');
    });

    // Send a message to the client when they connect
    ws.send('Welcome! You are connected to the WebSocket server.');
});

app.get('/', (req, res) => {
    res.send('Hello, this is the HTTP server running!');
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
