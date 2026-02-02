import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import "./ButtonMashRace.css";

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
    window.addEventListener("keyup", handleKeyPress);

    return () => {
      socket.off();
      window.removeEventListener("keyup", handleKeyPress);
    };
  }, [joined, started, winner, roomId]);

  const joinRace = () => {
    if (!name) return alert("Enter your name");
    socket.emit("joinRace", { name, roomId });
    setJoined(true);
  };

  // Sprites for player 1 and player 2
  const characterSprites = [
    "/sprites/player-1.png",
    "/sprites/player-2.png",
  ];
  
  return (
    <div className="button-mash-container">
      {!joined ? (
        <div className="join-screen">
          <input
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <button onClick={joinRace}>Join Race</button>
        </div>
      ) : (
        <div className="race-screen">
          {!started && (
            <div className="waiting-message">
              ⏳ Waiting for another player to join...
            </div>
          )}
          
          {winner && (
            <div className="winner-message">
              🎉 {winner} wins! 🏆
            </div>
          )}
          
          {started && !winner && (
            <div className="instructions">
              Press <strong>SPACEBAR</strong> to move! 🚀
            </div>
          )}

          <div className="race-track-container">
            {players.map((p, index) => (
              <div key={p.id} className="race-lane">
                <div className="lane-background"></div>
                {p.position < 100 && (
                  <div className="finish-line">
                    <img 
                      src="/sprites/finish-line.png"
                      alt="finish line"
                      className="finish-line-sprite"
                    />
                  </div>
                )}
                <div className="player-name">{p.name}</div>
                <div className="player-position">{Math.floor(p.position)}%</div>
                <div 
                  className="player-character"
                  style={{ left: `${p.position * 0.95}%` }}
                >
                  <img 
                    src={characterSprites[index % characterSprites.length]}
                    alt={`${p.name}'s character`}
                    className="character-sprite"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ButtonMashRace;

