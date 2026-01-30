import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

interface Player {
  id: string;
  name: string;
  position: number;
}

interface Race {
  players: Player[];
  started: boolean;
  finished: boolean;
}

const races: Record<string, Race> = {};

io.of("/minigame").on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("joinRace", ({ name, roomId }) => {
    // Create room if needed
    if (!races[roomId]) {
      races[roomId] = { players: [], started: false, finished: false };
    }

    const race = races[roomId];

    if (race.players.length >= 2) {
      socket.emit("raceFull");
      return;
    }

    // ✅ JOIN ROOM FIRST
    socket.join(roomId);

    // Add player
    race.players.push({
      id: socket.id,
      name,
      position: 0,
    });

    // Sync state
    io.of("/minigame").to(roomId).emit("raceUpdate", race.players);

    // Start race when 2 players are present
    if (race.players.length === 2) {
      race.started = true;
      io.of("/minigame").to(roomId).emit("raceStart");
    }
  });

  socket.on("press", ({ roomId }) => {
    const race = races[roomId];
    if (!race || !race.started || race.finished) return;

    const player = race.players.find((p) => p.id === socket.id);
    if (!player) return;

    player.position += 5;

    if (player.position >= 100) {
      race.finished = true;
      io.of("/minigame").to(roomId).emit("raceOver", player.name);
    }

    io.of("/minigame").to(roomId).emit("raceUpdate", race.players);
  });

  socket.on("disconnecting", () => {
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;

      const race = races[roomId];
      if (!race) continue;

      race.players = race.players.filter((p) => p.id !== socket.id);
      race.started = false;
      race.finished = false;

      io.of("/minigame").to(roomId).emit("raceUpdate", race.players);

      if (race.players.length === 0) {
        delete races[roomId];
      }
    }
  });
});

httpServer.listen(5001, () =>
  console.log("Minigame server running on port 5001")
);

