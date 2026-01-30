import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Player {
  id: string;
  name: string;
  position: number;
}

// --- Connect to backend namespace ---
const socket: Socket = io("http://localhost:5001/minigame");

const ButtonMashRace: React.FC = () => {
  const [roomId, setRoomId] = useState("room1"); // simple default
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [started, setStarted] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    socket.on("raceJoined", (racePlayers: Player[]) => setPlayers(racePlayers));
    socket.on("raceUpdate", (racePlayers: Player[]) => setPlayers(racePlayers));
    socket.on("raceStart", () => setStarted(true));
    socket.on("raceOver", (winnerName: string) => setWinner(winnerName));
    socket.on("raceFull", () => alert("Race is full!"));

    const handleKeyPress = (e: KeyboardEvent) => {
      if (joined && started && !winner && e.code === "Space") {
        socket.emit("press", { roomId });
      }
    };
    window.addEventListener("keydown", handleKeyPress);

    return () => {
      socket.off();
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [joined, started, winner, roomId]);

  const joinRace = () => {
    if (!name) return alert("Enter your name");
    socket.emit("joinRace", { name, roomId });
    setJoined(true);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      {!joined ? (
        <div>
          <input
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={{ marginLeft: "10px" }}
          />
          <button onClick={joinRace}>Join Race</button>
        </div>
      ) : (
        <div>
          <h2>Race!</h2>
          {!started && <p>Waiting for another player to join...</p>}
          {winner && <h3>{winner} wins! 🎉</h3>}
          {started && !winner && <p>Press <strong>Spacebar</strong> to move!</p>}

          <div style={{ marginTop: "20px" }}>
            {players.map((p) => (
              <div key={p.id} style={{ marginBottom: "10px" }}>
                <strong>{p.name}</strong>:{" "}
                <progress value={p.position} max={100} style={{ width: "300px" }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ButtonMashRace;

