const express = require("express");
const app = express();
const http = require("http");
const { processClientsSequentially } = require("./wsHandler");
const port = 8080; // 안쓰는 포트로 바꿔주세용!
const server = http.createServer(app);
const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });
const connections = [];
wss.on("connection", function connection(ws) {
  console.log("새로운 WebSocket 클라이언트가 연결되었습니다.");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "subscribe") {
        console.log("Received data:", data);
        const { id } = data;
        connections.push({ ws, stockId: id });
        console.log(`종목 ID ${id}에 대한 연결 `);
        processClientsSequentially(connections, 7000, 8000);
      }
    } catch (error) {
      console.error("Error parsing message:", error.message);
    }
  });
  ws.on("close", function close() {
    console.log("WebSocket 연결이 종료되었습니다.");
    const index = connections.findIndex((connection) => connection.ws === ws);
    if (index !== -1) {
      connections.splice(index, 1);
      console.log("연결이 connections 배열에서 제거되었습니다.");
    }
  });
});

server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
