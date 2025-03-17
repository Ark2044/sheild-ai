import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 5001 });

wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket");

  setInterval(() => {
    const transaction = {
      address: `0x${Math.random().toString(16).substr(2, 8)}`,
      amount: `${Math.floor(Math.random() * 10 + 1)} ETH`,
      risk: Math.random() > 0.5 ? "High" : "Low",
    };

    ws.send(JSON.stringify(transaction));
  }, 3000);
});

console.log("WebSocket server running on ws://localhost:5001");
