import { Server as HttpServer } from "http";
import { Server as IOServer, Socket } from "socket.io";
import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "@/types/next"; // Ensure this exists!

export default function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (!res.socket.server.io) {
    console.log("Initializing WebSocket server...");
    const httpServer: HttpServer = res.socket.server as HttpServer;
    const io = new IOServer(httpServer, {
      path: "/socket.io", // Ensure the correct WebSocket path
      cors: { origin: "*" }, // Allow all origins
    });

    io.on("connection", (socket: Socket) => {
      console.log("A user connected");

      socket.on("message", (msg: string) => {
        console.log("Received:", msg);
        io.emit("message", msg);
      });

      socket.on("disconnect", () => console.log("User disconnected"));
    });

    res.socket.server.io = io;
  } else {
    console.log("WebSocket server already running");
  }

  res.end();
}
