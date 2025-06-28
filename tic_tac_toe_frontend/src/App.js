import React, { useState, useEffect } from "react";
import "./App.css";

// Color palette
const PRIMARY = "#1976d2";
const ACCENT = "#ff9800";
const SECONDARY = "#424242";

// Helper function for API base (assumes frontend served from :3000, backend :3001)
const API_BASE =
  process.env.REACT_APP_TTT_API ||
  "http://localhost:3001";

// API Helpers
const api = {
  // PUBLIC_INTERFACE
  startGame: async () => {
    /** Starts a new Tic Tac Toe game. */
    const res = await fetch(`${API_BASE}/game`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to start new game");
    return res.json();
  },
  // PUBLIC_INTERFACE
  getGame: async (gameId) => {
    /** Gets game state for the given gameId. */
    const res = await fetch(`${API_BASE}/game/${gameId}`);
    if (!res.ok) throw new Error("Failed to fetch game state");
    return res.json();
  },
  // PUBLIC_INTERFACE
  makeMove: async (gameId, row, col) => {
    /** Makes a move at (row, col) for the given gameId. */
    const res = await fetch(`${API_BASE}/game/${gameId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ row, col }),
    });
    if (!res.ok) throw new Error("Invalid move");
    return res.json();
  },
};

const STATUS_DISPLAY = {
  ongoing: { text: "Your turn!", color: PRIMARY },
  draw: { text: "It's a draw.", color: SECONDARY },
  win_x: { text: "X wins! 🎉", color: ACCENT },
  win_o: { text: "O wins! 🎉", color: ACCENT },
};

// PUBLIC_INTERFACE
function TicTacToeBoard({ board, onSquareClick, disabled }) {
  /** Renders the 3x3 board. Accepts board state, onSquareClick(row, col), and disabled. */
  return (
    <div className="ttt-board" role="grid" aria-label="Tic Tac Toe Board">
      {board.map((row, i) => (
        <div className="ttt-row" key={i}>
          {row.map((cell, j) => (
            <button
              key={j}
              className="ttt-square"
              onClick={() => !disabled && onSquareClick(i, j)}
              disabled={disabled || !!cell}
              aria-label={
                cell
                  ? `Cell ${i + 1}, ${j + 1}, ${cell}`
                  : `Empty cell ${i + 1}, ${j + 1}`
              }
              tabIndex={0}
            >
              {cell}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function StatusPanel({ status, currentPlayer }) {
  /**
   * Shows the game status.
   * Status: 'ongoing', 'draw', 'win_x', 'win_o'
   */
  let display = STATUS_DISPLAY[status];
  let showPlayer = status === "ongoing" ? (
    <span
      style={{
        display: "inline-block",
        marginLeft: 8,
        color: ACCENT,
        fontWeight: 600,
      }}
      data-testid="current-player-marker"
    >
      ({currentPlayer === "X" ? "X" : "O"})
    </span>
  ) : null;

  return (
    <div
      className="status-panel"
      style={{
        color: display?.color || PRIMARY,
        fontSize: 22,
        marginBottom: 12,
        fontWeight: 600,
      }}
      data-testid="status-panel"
    >
      {display?.text || "Status"}
      {showPlayer}
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /**
   * Main App component for Tic Tac Toe.
   * Handles REST API integration, board state, and UI rendering.
   */
  // UI state
  const [gameId, setGameId] = useState(null);
  const [board, setBoard] = useState([
    ["", "", ""],
    ["", "", ""],
    ["", "", ""],
  ]);
  const [status, setStatus] = useState("ongoing"); // 'ongoing', 'win_x', 'win_o', 'draw'
  const [player, setPlayer] = useState("X");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [theme, setTheme] = useState("light");

  // PUBLIC_INTERFACE
  const startNewGame = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await api.startGame();
      setGameId(data.game_id);
      setBoard(data.board);
      setStatus(data.status);
      setPlayer(data.current_player || "X");
    } catch (err) {
      setError("Couldn't start game.");
    }
    setLoading(false);
  };

  // PUBLIC_INTERFACE
  const fetchGame = async (gid) => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getGame(gid);
      setBoard(data.board);
      setStatus(data.status);
      setPlayer(data.current_player || "X");
    } catch (err) {
      setError("Failed to fetch game.");
    }
    setLoading(false);
  };

  // PUBLIC_INTERFACE
  const handleMove = async (row, col) => {
    if (
      status !== "ongoing" ||
      !gameId ||
      board[row][col] !== ""
    )
      return;
    setLoading(true);
    try {
      const data = await api.makeMove(gameId, row, col);
      setBoard(data.board);
      setStatus(data.status);
      setPlayer(data.current_player || "X");
    } catch (err) {
      setError("Invalid move.");
    }
    setLoading(false);
  };

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Load game from API if gameId exists
  useEffect(() => {
    if (gameId) fetchGame(gameId);
    // eslint-disable-next-line
  }, [gameId]);

  // On mount, start a new game
  useEffect(() => {
    startNewGame();
    // eslint-disable-next-line
  }, []);

  const isGameActive = status === "ongoing";

  // PUBLIC_INTERFACE (theme toggle)
  const toggleTheme = () => {
    setTheme((theme) => (theme === "light" ? "dark" : "light"));
  };

  return (
    <div className="App" data-testid="app-root">
      <div className="ttt-main-container">
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        <h1 className="ttt-title" style={{ color: PRIMARY }}>
          Tic Tac Toe
        </h1>
        <StatusPanel status={status} currentPlayer={player} />
        {error && (
          <div className="ttt-error" role="alert" style={{ color: ACCENT }}>
            {error}
          </div>
        )}
        <TicTacToeBoard
          board={board}
          onSquareClick={handleMove}
          disabled={!isGameActive || loading}
        />
        <div className="ttt-controls">
          <button
            className="ttt-btn"
            onClick={startNewGame}
            style={{
              backgroundColor: ACCENT,
              color: "#fff",
              marginTop: 20,
            }}
            disabled={loading}
            data-testid="new-game-btn"
          >
            {loading ? "Starting..." : "New Game"}
          </button>
        </div>
        <footer className="ttt-footer">
          <span>
            Powered by{" "}
            <a
              href="https://reactjs.org"
              className="ttt-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              React
            </a>
            {" + "}
            <a
              href="https://fastapi.tiangolo.com/"
              className="ttt-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              FastAPI
            </a>
          </span>
        </footer>
      </div>
    </div>
  );
}

export default App;
