import { Server } from "socket.io";
import { Server as HTTPServer } from "http";

let io: Server;

export const initSocket = (httpServer: HTTPServer): Server => {
  const allowedOrigins = [
    process.env.CLIENT_URL,
    "http://localhost:5173",
    "http://localhost:3000",
  ].filter((url): url is string => Boolean(url));

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("join", (userId: string) => {
      if (userId) {
        socket.join(userId);
        console.log(`Socket ${socket.id} joined room: ${userId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io has not been initialized!");
  }
  return io;
};
