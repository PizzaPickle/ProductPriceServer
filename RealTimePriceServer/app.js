const express = require('express');
const app = express();
const http = require("http");
const { wsdata, addClient, removeClient } = require("./wsHandler");
const port = 8080;

const server = http.createServer(app);
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });

wss.on("connection", function connection(ws) {
    console.log("새로운 WebSocket 클라이언트가 연결되었습니다.");

    ws.on("message", (message) => {
        try {
            const data = JSON.parse(message);
            console.log("Received data:", data);
            const id = data.id;

            if (id) {
                wsdata(ws, id); 
            } else {
                console.error("ID is undefined");
            }
        } catch (error) {
            console.error("Error parsing message:", error.message);
        }
    });

    ws.on("close", function close() {
        console.log("WebSocket 연결이 종료되었습니다.");
        removeClient(ws);
    });
});

server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
