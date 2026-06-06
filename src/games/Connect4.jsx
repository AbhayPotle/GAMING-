// Connect4.jsx - Connect 4 game with local and online simulated bot
import React, { useState, useEffect } from 'react';
import SoundManager from '../components/SoundManager';
import { Play, RotateCcw, User, Cpu, Circle } from 'lucide-react';

const COLS = 7;
const ROWS = 6;

export default function Connect4({ onComplete, onQuit }) {
  const [board, setBoard] = useState(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameMode, setGameMode] = useState('ai'); // 'ai' or 'pvp'
  const [turn, setTurn] = useState('R'); // 'R' = Red (Player 1), 'Y' = Yellow (Player 2/Bot)
  const [winner, setWinner] = useState(null); // 'R', 'Y', or 'Tie'
  const [gameOver, setGameOver] = useState(false);
  const [botMessage, setBotMessage] = useState("Drop a chip to begin!");

  const handleStartGame = (mode) => {
    SoundManager.playClick();
    setBoard(Array(ROWS).fill(null).map(() => Array(COLS).fill(null)));
    setGameMode(mode);
    setTurn('R');
    setWinner(null);
    setGameOver(false);
    setBotMessage(mode === 'ai' ? "Good luck! Cyber CPU is ready." : "Red Player goes first!");
    setIsPlaying(true);
  };

  // Find lowest empty row in column
  const getLowestEmptyRow = (col, currentBoard) => {
    for (let r = ROWS - 1; r >= 0; r--) {
      if (!currentBoard[r][col]) return r;
    }
    return -1;
  };

  // Check victory condition
  const checkWin = (b) => {
    // Check horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        if (b[r][c] && b[r][c] === b[r][c+1] && b[r][c] === b[r][c+2] && b[r][c] === b[r][c+3]) return b[r][c];
      }
    }
    // Check vertical
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS; c++) {
        if (b[r][c] && b[r][c] === b[r+1][c] && b[r][c] === b[r+2][c] && b[r][c] === b[r+3][c]) return b[r][c];
      }
    }
    // Check diagonal down-right
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        if (b[r][c] && b[r][c] === b[r+1][c+1] && b[r][c] === b[r+2][c+2] && b[r][c] === b[r+3][c+3]) return b[r][c];
      }
    }
    // Check diagonal up-right
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        if (b[r][c] && b[r][c] === b[r-1][c+1] && b[r][c] === b[r-2][c+2] && b[r][c] === b[r-3][c+3]) return b[r][c];
      }
    }

    // Check tie
    const isTie = b.every(row => row.every(cell => cell !== null));
    if (isTie) return 'Tie';

    return null;
  };

  const handleDrop = (col) => {
    if (gameOver || !isPlaying) return;
    if (gameMode === 'ai' && turn === 'Y') return; // wait for CPU

    const row = getLowestEmptyRow(col, board);
    if (row === -1) return; // Column full

    const updated = board.map(r => [...r]);
    updated[row][col] = turn;
    setBoard(updated);
    SoundManager.playClick();

    const winResult = checkWin(updated);
    if (winResult) {
      handleGameOver(winResult);
      return;
    }

    const nextTurn = turn === 'R' ? 'Y' : 'R';
    setTurn(nextTurn);

    if (gameMode === 'ai' && nextTurn === 'Y') {
      setBotMessage("CPU is scanning columns...");
      setTimeout(() => triggerAiMove(updated), 800);
    } else {
      setBotMessage(nextTurn === 'R' ? "Red player's turn" : "Yellow player's turn");
    }
  };

  const triggerAiMove = (currentBoard) => {
    // Find all valid column drop moves
    const validCols = [];
    for (let c = 0; c < COLS; c++) {
      if (getLowestEmptyRow(c, currentBoard) !== -1) validCols.push(c);
    }

    if (validCols.length === 0) {
      handleGameOver('Tie');
      return;
    }

    // AI logic:
    // 1. Can AI win immediately?
    // 2. Can AI block opponent immediate win?
    // 3. Otherwise pick random column
    let chosenCol = -1;

    for (let c of validCols) {
      // test win
      const r = getLowestEmptyRow(c, currentBoard);
      const testBoard = currentBoard.map(row => [...row]);
      testBoard[r][c] = 'Y';
      if (checkWin(testBoard) === 'Y') {
        chosenCol = c;
        break;
      }
    }

    if (chosenCol === -1) {
      for (let c of validCols) {
        // test block
        const r = getLowestEmptyRow(c, currentBoard);
        const testBoard = currentBoard.map(row => [...row]);
        testBoard[r][c] = 'R';
        if (checkWin(testBoard) === 'R') {
          chosenCol = c;
          break;
        }
      }
    }

    if (chosenCol === -1) {
      // Pick random
      chosenCol = validCols[Math.floor(Math.random() * validCols.length)];
    }

    const row = getLowestEmptyRow(chosenCol, currentBoard);
    const updated = currentBoard.map(r => [...r]);
    updated[row][chosenCol] = 'Y';
    setBoard(updated);
    SoundManager.playLaser(); // CPU sound

    const winResult = checkWin(updated);
    if (winResult) {
      handleGameOver(winResult);
      return;
    }

    setTurn('R');
    
    // Funny reactions
    const reactList = [
      "Let's see you block this! 👾",
      "Calculated! ⚡",
      "Your move, human. 🤖",
      "Nice move earlier! 👍",
      "This grid is mine! ♟️"
    ];
    setBotMessage(reactList[Math.floor(Math.random() * reactList.length)]);
  };

  const handleGameOver = (winResult) => {
    setWinner(winResult);
    setGameOver(true);
    SoundManager.playLevelUp();
    if (winResult === 'R' || (gameMode === 'pvp' && winResult !== 'Tie')) {
      onComplete(120); // payout reward!
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-[#070314] overflow-hidden select-none font-display">
      {/* HUD Header */}
      <div className="bg-slate-950 px-5 py-3 border-b border-white/10 flex justify-between items-center text-xs">
        <div className="flex items-center gap-3 text-cyan-400">
          {gameMode === 'ai' ? (
            <span className="flex items-center gap-1"><Cpu className="w-4 h-4 text-cyan-400" /> ONLINE BOT LOBBY</span>
          ) : (
            <span className="flex items-center gap-1"><User className="w-4 h-4 text-pink-400" /> LOCAL 2-PLAYERS</span>
          )}
        </div>
        <div className="text-yellow-400 font-extrabold uppercase tracking-widest">{botMessage}</div>
      </div>

      {/* Main Board Arena */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {!isPlaying ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-8 text-center z-10">
            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-600 tracking-wider mb-2 uppercase">Connect 4</h3>
            <p className="text-gray-400 text-xs max-w-sm mb-6">Take turns dropping glowing neon chips. Get 4 chips in a row (vertical, horizontal, or diagonal) to win!</p>
            <div className="flex gap-4">
              <button
                onClick={() => handleStartGame('ai')}
                className="px-6 py-2.5 rounded-lg bg-cyan-500 text-black font-extrabold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Cpu className="w-4 h-4" /> PLAY CYBER CPU
              </button>
              <button
                onClick={() => handleStartGame('pvp')}
                className="px-6 py-2.5 rounded-lg bg-pink-500 text-white font-extrabold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <User className="w-4 h-4" /> LOCAL DOCK DUEL
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[360px] flex flex-col items-center gap-4">
            {/* Connect 4 Blue Board Layout */}
            <div className="w-full bg-[#12082b] border-4 border-cyan-500/30 rounded-2xl p-4 shadow-[0_0_35px_rgba(0,240,255,0.15)]">
              {/* Column click selectors indicator row */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {Array(COLS).fill(0).map((_, colIdx) => {
                  const colFull = getLowestEmptyRow(colIdx, board) === -1;
                  return (
                    <button
                      key={colIdx}
                      disabled={colFull || gameOver || (gameMode === 'ai' && turn === 'Y')}
                      onClick={() => handleDrop(colIdx)}
                      className={`h-7 rounded-lg transition-all border flex items-center justify-center ${
                        colFull 
                          ? 'border-transparent opacity-20' 
                          : 'bg-white/5 border-white/10 hover:bg-cyan-500/20 hover:border-cyan-400'
                      }`}
                      title="Drop chip"
                    >
                      <span className="text-[10px] font-bold text-gray-400 select-none">↓</span>
                    </button>
                  );
                })}
              </div>

              {/* Grid cell layout */}
              <div className="grid grid-cols-7 gap-2.5 bg-blue-950/40 p-3.5 rounded-xl border border-white/5">
                {/* Board rows */}
                {board.map((row, r) => 
                  row.map((cell, c) => {
                    return (
                      <div 
                        key={`${r}-${c}`}
                        className="aspect-square rounded-full bg-black/60 border border-white/10 flex items-center justify-center shadow-inner"
                      >
                        {cell === 'R' && (
                          <div className="w-5/6 h-5/6 rounded-full bg-gradient-to-tr from-red-600 to-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.7)] border border-red-500 animate-fade-in"></div>
                        )}
                        {cell === 'Y' && (
                          <div className="w-5/6 h-5/6 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.7)] border border-yellow-400 animate-fade-in"></div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Game Over screen */}
        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 p-6 text-center z-20">
            <h3 className="text-3xl font-black text-white tracking-wider mb-2 uppercase">
              {winner === 'Tie' ? "MATCH DRAW" : "CONNECT 4 WIN"}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {winner === 'Tie' 
                ? "The board is full. Perfect match!" 
                : winner === 'R' 
                  ? "Red player dominates the grid!" 
                  : "Cyber CPU wins the connection duel!"}
            </p>
            <div className="bg-white/5 border border-white/5 p-4 rounded-xl mb-6">
              <p className="text-xs text-gray-400">WINNER: <span className="text-yellow-400 font-extrabold text-lg uppercase">{winner === 'R' ? 'Red' : winner === 'Y' ? 'Yellow' : 'None'}</span></p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={onQuit}
                className="px-5 py-2 rounded-lg border border-white/10 text-gray-300 text-xs font-bold uppercase transition-all"
              >
                Quit Cabin
              </button>
              <button
                onClick={() => handleStartGame(gameMode)}
                className="px-5 py-2 rounded-lg bg-pink-500 text-white text-xs font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
              >
                <RotateCcw className="w-4 h-4" /> Rematch
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Rules Footer */}
      <div className="bg-slate-950 p-2.5 border-t border-white/10 flex justify-between items-center text-[10px] text-gray-600 font-bold uppercase tracking-widest px-6">
        <span>Click the drop arrows at top of columns to drop chips</span>
        <span>Simulated AI matches adapt to block your lines</span>
      </div>
    </div>
  );
}
