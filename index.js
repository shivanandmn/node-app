const WebSocket = require("ws");
const http = require("http");
const express = require("express");
const path = require("path");
const fs = require("fs");
const { Readable } = require("stream");
const { createAudioResource, createAudioPlayer, AudioPlayerStatus, VoiceConnectionStatus, joinVoiceChannel } = require('@discordjs/voice');

const app = express();
const server = http.createServer(app);

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, "public")));

const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";
const ws = new WebSocket(url, {
    headers: {
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
        "OpenAI-Beta": "realtime=v1",
    },
});

ws.on("open", function open() {
    console.log("Connected to server.");
    ws.send(JSON.stringify({
        type: "response.create",
        response: {
            modalities: ["text", "audio"],
            instructions: "Please assist the user with voice and text.",
        }
    }));
});

ws.on("message", function incoming(message) {
    const response = JSON.parse(message.toString());
    if (response.type === "conversation.item.create") {
        if (response.item && response.item.content) {
            response.item.content.forEach(content => {
                if (content.type === "input_text") {
                    console.log("Assistant Text: ", content.text);
                } else if (content.type === "input_audio") {
                    // Convert the base64 encoded audio to a buffer
                    const audioBuffer = Buffer.from(content.audio, 'base64');
                    
                    // Save the audio file locally for playing
                    fs.writeFileSync("response_audio.wav", audioBuffer);
                    console.log("Audio response saved as response_audio.wav");
                    
                    // Here you can implement code to play the saved audio, such as with ffmpeg or another player
                }
            });
        }
    }
});

// Endpoint to accept audio input from user and send to Realtime API
app.post("/send-audio", (req, res) => {
    let audioData = [];

    req.on("data", chunk => {
        audioData.push(chunk);
    });

    req.on("end", () => {
        const audioBuffer = Buffer.concat(audioData);
        const base64Audio = audioBuffer.toString('base64');
        
        // Send audio data to Realtime API
        ws.send(JSON.stringify({
            type: "conversation.item.create",
            item: {
                type: "message",
                role: "user",
                content: [{
                    type: "input_audio",
                    audio: base64Audio
                }]
            }
        }));

        res.status(200).send("Audio sent to Realtime API");
    });
});

server.listen(3000, () => {
    console.log("Server is listening on port 3000");
});