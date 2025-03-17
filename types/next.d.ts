import { Server as HttpServer } from "http";
import { Server as IOServer } from "socket.io";
import { NextApiResponse } from "next";

export interface NextApiResponseServerIo extends NextApiResponse {
  socket: NextApiResponse["socket"] & {
    server: HttpServer & {
      io?: IOServer;
    };
  };
}
