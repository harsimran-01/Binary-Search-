
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Board from '@/components/Board';
import { 
  type BoardState, 
  type Player, 
  type GameMode,
  type DifficultyLevel,
  WINNING_COMBINATIONS,
  checkWinner, 
  checkDraw, 
  createEmptyBoard, 
  makeAIMove,
  getGameStatusText,
  findBoardStateIndex,
  getDifficultyIcon,
  getDifficultyDescription
} from '@/utils/gameLogic';
import { transitions } from '@/utils/animation';

const Game: React.FC = () => {
  // Game state
  const [board, setBoard] = useState<BoardState>(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>('X');
  const [winner, setWinner] = useState<Player>(null);
  const [winningCombo, setWinningCombo] = useState<number[] | null>(null);
  const [isDraw, setIsDraw] = useState<boolean>(false);
  const [gameMode, setGameMode] = useState<GameMode>('player-vs-ai');
  const [gameHistory, setGameHistory] = useState<BoardState[]>([createEmptyBoard()]);
  const [currentMove, setCurrentMove] = useState<number>(0);
  const [isAIThinking, setIsAIThinking] = useState<boolean>(false);
  const [showAnimation, setShowAnimation] = useState<boolean>(true);
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('medium');
  
  const boardRef = useRef<HTMLDivElement>(null);
  const gameOver = winner !== null || isDraw;
  
  // Handle difficulty change
  const handleDifficultyChange = (level: DifficultyLevel) => {
    setDifficultyLevel(level);
    toast.info(`Difficulty set to ${level}`);
  };
  
  // Handle player move
  const handleSquareClick = (index: number) => {
    // Don't allow moves if the game is over or if it's the AI's turn
    if (winner || isDraw || board[index] !== null || (gameMode === 'player-vs-ai' && currentPlayer === 'O' && !gameOver)) {
      return;
    }
    
    // Make the move
    makeMove(index);
  };
  
  // Make a move
  const makeMove = (index: number) => {
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    
    // Update board
    setBoard(newBoard);
    
    // Check if the game is over
    const nextWinner = checkWinner(newBoard);
    const nextIsDraw = checkDraw(newBoard);
    
    if (nextWinner) {
      setWinner(nextWinner);
      // Find the winning combination
      setWinningCombo(
        WINNING_COMBINATIONS.find(combo => {
          const [a, b, c] = combo;
          return newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c];
        }) || null
      );
      
      // Show toast notification
      toast.success(`Player ${nextWinner} wins!`);
    } else if (nextIsDraw) {
      setIsDraw(true);
      toast.info("It's a draw!");
    } else {
      // Switch player
      setCurrentPlayer(currentPlayer === 'X' ? 'O' : 'X');
      
      // Truncate history if we're not at the end
      const newHistory = gameHistory.slice(0, currentMove + 1).concat([newBoard]);
      setGameHistory(newHistory);
      setCurrentMove(newHistory.length - 1);
    }
  };
  
  // AI move effect
  useEffect(() => {
    if (gameMode === 'player-vs-ai' && currentPlayer === 'O' && !winner && !isDraw) {
      setIsAIThinking(true);
      
      const timer = setTimeout(() => {
        const aiMoveIndex = makeAIMove(board, 'O', difficultyLevel);
        makeMove(aiMoveIndex);
        setIsAIThinking(false);
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameMode, winner, isDraw, difficultyLevel]);
  
  // Reset game
  const resetGame = () => {
    setBoard(createEmptyBoard());
    setCurrentPlayer('X');
    setWinner(null);
    setWinningCombo(null);
    setIsDraw(false);
    setGameHistory([createEmptyBoard()]);
    setCurrentMove(0);
    setIsAIThinking(false);
    setDifficultyLevel('medium');
    
    toast.info("New game started!");
  };
  
  // Switch game mode
  const handleGameModeChange = (newMode: GameMode) => {
    if (newMode !== gameMode) {
      setGameMode(newMode);
      resetGame();
      
      toast.info(`Switched to ${newMode === 'player-vs-player' ? 'Player vs Player' : 'Player vs AI'} mode`);
    }
  };
  
  // Jump to move in history
  const jumpToMove = (moveIndex: number) => {
    if (moveIndex >= 0 && moveIndex < gameHistory.length) {
      setCurrentMove(moveIndex);
      setBoard(gameHistory[moveIndex]);
      setCurrentPlayer(moveIndex % 2 === 0 ? 'X' : 'O');
      setWinner(null);
      setWinningCombo(null);
      setIsDraw(false);
      
      if (moveIndex === gameHistory.length - 1) {
        // Check if the game is actually over at this point
        const currentWinner = checkWinner(gameHistory[moveIndex]);
        const currentIsDraw = checkDraw(gameHistory[moveIndex]);
        
        if (currentWinner) {
          setWinner(currentWinner);
          setWinningCombo(
            WINNING_COMBINATIONS.find(combo => {
              const [a, b, c] = combo;
              const boardState = gameHistory[moveIndex];
              return boardState[a] && boardState[a] === boardState[b] && boardState[a] === boardState[c];
            }) || null
          );
        } else if (currentIsDraw) {
          setIsDraw(true);
        }
      }
    }
  };
  
  // Toggle animations
  const handleToggleAnimations = () => {
    setShowAnimation(!showAnimation);
    toast.info(`Animations ${!showAnimation ? 'enabled' : 'disabled'}`);
  };
  
  // Current game status text
  const statusText = getGameStatusText(winner, isDraw, currentPlayer);
  
  // Use binary search to find current move in history for demo purposes
  const findCurrentBoardIndex = () => {
    const index = findBoardStateIndex(gameHistory, board);
    return index;
  };
  
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4 ${showAnimation ? 'overflow-hidden' : ''}`}>
      <div className={`game-container ${showAnimation ? transitions.scaleIn : ''} max-w-6xl w-full`}>
        <div className="mb-8 text-center">
          <h1 className="game-title">Binary Search Tic Tac Toe</h1>
          <p className="game-subtitle">
            A demonstration of binary search algorithm in game development
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left side: Game board */}
          <div className="w-full lg:w-1/2">
            <Card className="glassmorphic overflow-hidden h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-medium">Game Board</CardTitle>
                    <CardDescription>
                      {isAIThinking ? "AI is thinking..." : statusText}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="animations"
                      checked={showAnimation}
                      onCheckedChange={handleToggleAnimations}
                    />
                    <Label htmlFor="animations">Animations</Label>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4 flex items-center justify-center">
                <div 
                  ref={boardRef}
                  className={`game-board-wrapper max-w-md w-full mx-auto aspect-square ${showAnimation && (isAIThinking ? transitions.pulse : '')}`}
                >
                  <Board 
                    board={board} 
                    onClick={handleSquareClick} 
                    winningCombo={winningCombo}
                  />
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between pt-2">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={resetGame}
                    className={`${transitions.default} ${transitions.hover.scale} ${transitions.active.scale}`}
                    disabled={isAIThinking}
                  >
                    Reset Game
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => jumpToMove(currentMove - 1)}
                    disabled={currentMove === 0 || isAIThinking}
                    className={`${transitions.default} ${transitions.hover.scale} ${transitions.active.scale}`}
                  >
                    Undo Move
                  </Button>
                </div>
                
                <div className="flex items-center">
                  <span className="status-chip">
                    {gameMode === 'player-vs-player' ? 'PvP Mode' : 'vs AI'}
                  </span>
                </div>
              </CardFooter>
            </Card>
          </div>
          
          {/* Right side: Game controls and info */}
          <div className="w-full lg:w-1/2">
            <Tabs defaultValue="game-info" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="game-info">Game Info</TabsTrigger>
                <TabsTrigger value="move-history">Move History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="game-info">
                <Card className="glassmorphic h-full">
                  <CardHeader>
                    <CardTitle>Game Modes</CardTitle>
                    <CardDescription>
                      Choose how you want to play
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        variant={gameMode === 'player-vs-player' ? 'default' : 'outline'}
                        onClick={() => handleGameModeChange('player-vs-player')}
                        className={`${transitions.default} ${transitions.hover.scale} ${transitions.active.scale}`}
                        disabled={isAIThinking}
                      >
                        Player vs Player
                      </Button>
                      
                      <Button
                        variant={gameMode === 'player-vs-ai' ? 'default' : 'outline'}
                        onClick={() => handleGameModeChange('player-vs-ai')}
                        className={`${transitions.default} ${transitions.hover.scale} ${transitions.active.scale}`}
                        disabled={isAIThinking}
                      >
                        Player vs AI
                      </Button>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">AI Difficulty Levels</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((level) => {
                          const DifficultyIcon = getDifficultyIcon(level);
                          return (
                            <Button
                              key={level}
                              variant={difficultyLevel === level ? 'default' : 'outline'}
                              onClick={() => handleDifficultyChange(level)}
                              disabled={gameMode !== 'player-vs-ai' || isAIThinking}
                              className="flex items-center justify-center space-x-2"
                            >
                              <DifficultyIcon className="mr-2" />
                              {level.charAt(0).toUpperCase() + level.slice(1)}
                            </Button>
                          );
                        })}
                      </div>
                      
                      {gameMode === 'player-vs-ai' && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Current Difficulty: {difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1)}
                          <br />
                          {getDifficultyDescription(difficultyLevel)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="move-history">
                <Card className="glassmorphic h-full">
                  <CardHeader>
                    <CardTitle>Move History</CardTitle>
                    <CardDescription>
                      Review and jump to previous moves
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2">
                      {gameHistory.map((_, index) => (
                        <Button
                          key={index}
                          variant={currentMove === index ? 'default' : 'outline'}
                          className="w-full justify-start"
                          onClick={() => jumpToMove(index)}
                          disabled={isAIThinking}
                        >
                          {index === 0 ? 'Game Start' : `Move #${index} - Player ${index % 2 === 0 ? 'O' : 'X'}`}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;
