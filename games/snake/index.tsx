// games/snake/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react'; // For the next step

// --- Constants ---
const CANVAS_SIZE = 400;
const GRID_SIZE = 20;
const TILE_SIZE = CANVAS_SIZE / GRID_SIZE;
const GAME_SPEED = 150;

type Point = { x: number; y: number };

// --- Helper ---
const generateFood = (snakeBody: Point[]): Point => {
  let newFood: Point;
  do {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snakeBody.some(s => s.x === newFood.x && s.y === newFood.y));
  return newFood;
};

// --- The Game Component ---
const SnakeGame = () => {
  const { data: session } = useSession();
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState(() => generateFood(snake));
  const [direction, setDirection] = useState<Point>({ x: 0, y: -1 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // --- Refs for Game Loop ---
  // We use refs for game logic that shouldn't trigger re-renders
  const gameLoopRef = useRef<number | null>(null);
  const directionRef = useRef(direction);
  directionRef.current = direction; // Keep the ref updated with the latest state

  // --- Game Restart Logic ---
  const restartGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setFood(generateFood([{ x: 10, y: 10 }]));
    setDirection({ x: 0, y: -1 });
    setScore(0);
    setIsGameOver(false);
  };

  // --- Keyboard Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = e.key.toUpperCase();
      const currentDir = directionRef.current;

      if ((key === 'W' || key === 'ARROWUP') && currentDir.y === 0) {
        setDirection({ x: 0, y: -1 });
      } else if ((key === 'S' || key === 'ARROWDOWN') && currentDir.y === 0) {
        setDirection({ x: 0, y: 1 });
      } else if ((key === 'A' || key === 'ARROWLEFT') && currentDir.x === 0) {
        setDirection({ x: -1, y: 0 });
      } else if ((key === 'D' || key === 'ARROWRIGHT') && currentDir.x === 0) {
        setDirection({ x: 1, y: 0 });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty dependency array: this setup runs only once

  useEffect(() => {
    // Check if the game has just ended, the score is greater than 0, and the user is logged in.
    if (isGameOver && score > 0 && session?.user?.id) {
      console.log(`Game over! Submitting score: ${score}`);
      
      const submitScore = async () => {
        try {
          const response = await fetch('/api/scores', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: session.user.id, // The user's ID from the session
              gameSlug: 'snake',      // The slug for this game
              score: score,           // The final score
            }),
          });

          if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
          }

          const data = await response.json();
          console.log('Score submitted successfully:', data);
        } catch (error) {
          console.error('Error submitting score:', error);
        }
      };

      submitScore();
    }
  }, [isGameOver, score, session]); 
  // --- The Main Game Loop `useEffect` ---
  useEffect(() => {
    if (isGameOver) {
      // TODO: Submit score in the final step
      return;
    }

    const gameLoop = () => {
      // Use the ref for direction to get the latest value
      const currentDirection = directionRef.current;

      setSnake(prevSnake => {
        const newHead = {
          x: prevSnake[0].x + currentDirection.x,
          y: prevSnake[0].y + currentDirection.y,
        };

        // Wall collision
        if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
          setIsGameOver(true);
          return prevSnake;
        }

        // Self collision
        for (let segment of prevSnake) {
          if (segment.x === newHead.x && segment.y === newHead.y) {
            setIsGameOver(true);
            return prevSnake;
          }
        }

        const newSnake = [newHead, ...prevSnake];

        // Food collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    // Set up the interval
    const intervalId = setInterval(gameLoop, GAME_SPEED);
    gameLoopRef.current = intervalId as unknown as number;

    // Clean up the interval on unmount or when game is over
    return () => clearInterval(intervalId);
  }, [isGameOver, food]); // Re-run the effect only when game state changes

  // --- Drawing `useEffect` ---
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    context.fillStyle = 'lightgreen';
    snake.forEach(segment => context.fillRect(segment.x * TILE_SIZE, segment.y * TILE_SIZE, TILE_SIZE, TILE_SIZE));
    context.fillStyle = 'red';
    context.fillRect(food.x * TILE_SIZE, food.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
  }, [snake, food]); // Re-draw whenever the snake or food changes

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">Snake</h2>
      <p className="mb-4 text-lg font-semibold text-primary">Score: {score}</p>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="bg-slate-800 border-4 border-primary"
        />
        {isGameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center">
            <p className="text-4xl font-bold text-white">Game Over</p>
            <button
              onClick={restartGame}
              className="mt-4 px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-md transition"
            >
              Restart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SnakeGame;