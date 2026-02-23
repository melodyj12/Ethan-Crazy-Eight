/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Card as CardComponent } from './components/Card';
import { Card, GameState, Suit, SUITS } from './types';
import { createDeck, canPlayCard, getSuitSymbol, getSuitColor } from './utils';
import { Trophy, RotateCcw, Info, ChevronRight, Hand, Brain, Layers } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    deck: [],
    discardPile: [],
    playerHand: [],
    aiHand: [],
    currentTurn: 'player',
    status: 'waiting',
    winner: null,
    activeSuit: null,
  });

  const [message, setMessage] = useState("Welcome to Ethan Crazy Eights!");
  const [showSuitPicker, setShowSuitPicker] = useState(false);

  // Initialize game
  const startGame = () => {
    const fullDeck = createDeck();
    const playerHand = fullDeck.splice(0, 8);
    const aiHand = fullDeck.splice(0, 8);
    const firstDiscard = fullDeck.pop()!;
    
    setGameState({
      deck: fullDeck,
      discardPile: [firstDiscard],
      playerHand,
      aiHand,
      currentTurn: 'player',
      status: 'playing',
      winner: null,
      activeSuit: null,
    });
    setMessage("Your turn! Match the card or play an 8.");
  };

  // Handle player playing a card
  const playCard = (card: Card) => {
    if (gameState.currentTurn !== 'player' || gameState.status !== 'playing') return;

    const topCard = gameState.discardPile[gameState.discardPile.length - 1];
    if (!canPlayCard(card, topCard, gameState.activeSuit)) return;

    const newPlayerHand = gameState.playerHand.filter(c => c.id !== card.id);
    const newDiscardPile = [...gameState.discardPile, card];

    if (newPlayerHand.length === 0) {
      setGameState(prev => ({
        ...prev,
        playerHand: newPlayerHand,
        discardPile: newDiscardPile,
        status: 'game_over',
        winner: 'player'
      }));
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
      return;
    }

    if (card.rank === '8') {
      setGameState(prev => ({
        ...prev,
        playerHand: newPlayerHand,
        discardPile: newDiscardPile,
        status: 'choosing_suit'
      }));
      setShowSuitPicker(true);
    } else {
      setGameState(prev => ({
        ...prev,
        playerHand: newPlayerHand,
        discardPile: newDiscardPile,
        currentTurn: 'ai',
        activeSuit: null
      }));
      setMessage("AI is thinking...");
    }
  };

  // Handle suit selection for 8s
  const selectSuit = (suit: Suit) => {
    setGameState(prev => ({
      ...prev,
      status: 'playing',
      currentTurn: 'ai',
      activeSuit: suit
    }));
    setShowSuitPicker(false);
    setMessage(`Suit changed to ${suit.toUpperCase()}! AI's turn.`);
  };

  // Handle drawing a card
  const drawCard = () => {
    if (gameState.currentTurn !== 'player' || gameState.status !== 'playing') return;
    
    if (gameState.deck.length === 0) {
      setMessage("Deck is empty! Skipping turn.");
      setGameState(prev => ({ ...prev, currentTurn: 'ai' }));
      return;
    }

    const newDeck = [...gameState.deck];
    const drawnCard = newDeck.pop()!;
    
    setGameState(prev => ({
      ...prev,
      deck: newDeck,
      playerHand: [...prev.playerHand, drawnCard],
      currentTurn: 'ai'
    }));
    setMessage("You drew a card. AI's turn.");
  };

  // AI Logic
  useEffect(() => {
    if (gameState.currentTurn === 'ai' && gameState.status === 'playing') {
      const timer = setTimeout(() => {
        const topCard = gameState.discardPile[gameState.discardPile.length - 1];
        const playableCards = gameState.aiHand.filter(c => canPlayCard(c, topCard, gameState.activeSuit));

        if (playableCards.length > 0) {
          // AI strategy: play non-8 if possible, otherwise play 8
          const nonEight = playableCards.find(c => c.rank !== '8');
          const cardToPlay = nonEight || playableCards[0];

          const newAiHand = gameState.aiHand.filter(c => c.id !== cardToPlay.id);
          const newDiscardPile = [...gameState.discardPile, cardToPlay];

          if (newAiHand.length === 0) {
            setGameState(prev => ({
              ...prev,
              aiHand: newAiHand,
              discardPile: newDiscardPile,
              status: 'game_over',
              winner: 'ai'
            }));
            return;
          }

          if (cardToPlay.rank === '8') {
            // AI chooses suit it has most of
            const suitCounts: Record<Suit, number> = { hearts: 0, diamonds: 0, clubs: 0, spades: 0 };
            newAiHand.forEach(c => suitCounts[c.suit]++);
            let bestSuit: Suit = 'hearts';
            let maxCount = -1;
            SUITS.forEach(s => {
              if (suitCounts[s] > maxCount) {
                maxCount = suitCounts[s];
                bestSuit = s;
              }
            });

            setGameState(prev => ({
              ...prev,
              aiHand: newAiHand,
              discardPile: newDiscardPile,
              currentTurn: 'player',
              activeSuit: bestSuit
            }));
            setMessage(`AI played an 8 and changed suit to ${bestSuit.toUpperCase()}! Your turn.`);
          } else {
            setGameState(prev => ({
              ...prev,
              aiHand: newAiHand,
              discardPile: newDiscardPile,
              currentTurn: 'player',
              activeSuit: null
            }));
            setMessage(`AI played ${cardToPlay.rank} of ${cardToPlay.suit}. Your turn!`);
          }
        } else {
          // AI must draw
          if (gameState.deck.length > 0) {
            const newDeck = [...gameState.deck];
            const drawnCard = newDeck.pop()!;
            setGameState(prev => ({
              ...prev,
              deck: newDeck,
              aiHand: [...prev.aiHand, drawnCard],
              currentTurn: 'player'
            }));
            setMessage("AI drew a card. Your turn!");
          } else {
            setGameState(prev => ({ ...prev, currentTurn: 'player' }));
            setMessage("AI couldn't play and deck is empty. Your turn!");
          }
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState.currentTurn, gameState.status, gameState.aiHand, gameState.discardPile, gameState.activeSuit, gameState.deck]);

  const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];

  return (
    <div className="min-h-screen bg-emerald-900 text-white font-sans selection:bg-emerald-500/30 overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-emerald-900 font-black text-xl">8</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">Ethan Crazy Eights</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm">
            <Brain className="w-4 h-4 text-blue-400" />
            <span>AI: {gameState.aiHand.length}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-sm">
            <Hand className="w-4 h-4 text-green-400" />
            <span>You: {gameState.playerHand.length}</span>
          </div>
          <button 
            onClick={startGame}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Restart Game"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Game Board */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-4 gap-8">
        {gameState.status === 'waiting' ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <div className="mb-8 relative inline-block">
              <div className="absolute -inset-4 bg-emerald-500/20 blur-2xl rounded-full" />
              <div className="relative flex -space-x-8">
                <div className="w-24 h-36 bg-white rounded-xl border-2 border-slate-200 rotate-[-15deg] shadow-xl flex items-center justify-center text-red-600 text-4xl font-bold">8♥</div>
                <div className="w-24 h-36 bg-white rounded-xl border-2 border-slate-200 rotate-[5deg] shadow-xl flex items-center justify-center text-slate-900 text-4xl font-bold">8♠</div>
              </div>
            </div>
            <h2 className="text-4xl font-black mb-4">Master the 8s</h2>
            <p className="text-emerald-100/70 mb-8">A classic game of strategy and luck. Be the first to clear your hand!</p>
            <button 
              onClick={startGame}
              className="px-8 py-4 bg-white text-emerald-900 rounded-2xl font-bold text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto"
            >
              Start Game <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>
        ) : (
          <>
            {/* AI Hand */}
            <div className="flex justify-center -space-x-8 sm:-space-x-12 opacity-80">
              {gameState.aiHand.map((_, i) => (
                <CardComponent key={`ai-${i}`} card={{} as any} isFaceDown className="scale-75 sm:scale-90" />
              ))}
            </div>

            {/* Center Area: Deck and Discard */}
            <div className="flex items-center gap-8 sm:gap-16">
              {/* Draw Pile */}
              <div className="relative group cursor-pointer" onClick={drawCard}>
                <div className="absolute -inset-1 bg-white/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  {gameState.deck.length > 0 ? (
                    <>
                      <div className="absolute top-1 left-1 w-16 h-24 sm:w-24 sm:h-36 bg-indigo-800 rounded-lg border-2 border-white/50" />
                      <CardComponent card={{} as any} isFaceDown />
                      <div className="absolute -bottom-6 left-0 right-0 text-center text-xs font-bold text-emerald-200/50">
                        {gameState.deck.length} LEFT
                      </div>
                    </>
                  ) : (
                    <div className="w-16 h-24 sm:w-24 sm:h-36 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center">
                      <span className="text-xs text-white/20">EMPTY</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Discard Pile */}
              <div className="relative">
                <AnimatePresence mode="popLayout">
                  <CardComponent 
                    key={topDiscard.id} 
                    card={topDiscard} 
                    className="shadow-2xl ring-4 ring-white/10"
                  />
                </AnimatePresence>
                {gameState.activeSuit && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-2xl border-2 border-emerald-500 ${getSuitColor(gameState.activeSuit)}`}
                  >
                    {getSuitSymbol(gameState.activeSuit)}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Status Message */}
            <div className="h-8 flex items-center justify-center">
              <motion.p 
                key={message}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-medium text-emerald-100 text-center"
              >
                {message}
              </motion.p>
            </div>

            {/* Player Hand */}
            <div className="w-full max-w-4xl px-4">
              <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
                {gameState.playerHand.map((card) => (
                  <CardComponent 
                    key={card.id} 
                    card={card} 
                    isPlayable={gameState.currentTurn === 'player' && gameState.status === 'playing' && canPlayCard(card, topDiscard, gameState.activeSuit)}
                    onClick={() => playCard(card)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Suit Picker Modal */}
      <AnimatePresence>
        {showSuitPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-slate-900"
            >
              <h3 className="text-2xl font-bold mb-6 text-center">Choose a Suit</h3>
              <div className="grid grid-cols-2 gap-4">
                {SUITS.map((suit) => (
                  <button
                    key={suit}
                    onClick={() => selectSuit(suit)}
                    className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                  >
                    <span className={`text-5xl mb-2 group-hover:scale-110 transition-transform ${getSuitColor(suit)}`}>
                      {getSuitSymbol(suit)}
                    </span>
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-500">
                      {suit}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Game Over Modal */}
      <AnimatePresence>
        {gameState.status === 'game_over' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] p-10 max-w-md w-full shadow-2xl text-slate-900 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-blue-500 to-emerald-500" />
              
              <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600">
                {gameState.winner === 'player' ? <Trophy className="w-10 h-10" /> : <RotateCcw className="w-10 h-10" />}
              </div>

              <h2 className="text-4xl font-black mb-2">
                {gameState.winner === 'player' ? 'Victory!' : 'Defeat!'}
              </h2>
              <p className="text-slate-500 mb-8">
                {gameState.winner === 'player' 
                  ? "Incredible strategy! You've cleared all your cards." 
                  : "The AI outplayed you this time. Ready for a rematch?"}
              </p>

              <button 
                onClick={startGame}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all"
              >
                Play Again
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <footer className="p-4 text-center text-xs text-white/30 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1">
          <Info className="w-3 h-3" />
          <span>8 is Wild</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-white/20" />
        <span>Match Suit or Rank</span>
      </footer>
    </div>
  );
}
