import React, { useState, useEffect } from 'react';
import { Droplet, Share2, Lightbulb, Trophy, MessageSquare, Star, CheckCircle } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

// Function to load confetti script dynamically
const loadConfetti = () => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
        script.onload = () => resolve(window.confetti);
        script.onerror = () => reject(new Error('Failed to load confetti script'));
        document.body.appendChild(script);
    });
};

const ColorAlchemyGame = () => {
    const [gameMode, setGameMode] = useState('daily');
    const [currentMix, setCurrentMix] = useState({ r: 128, g: 128, b: 128 });
    const [targetColor, setTargetColor] = useState({ r: 255, g: 255, b: 255 });
    const [attempts, setAttempts] = useState(0);
    const [gameWon, setGameWon] = useState(false);
    const [hasPlayedDaily, setHasPlayedDaily] = useState(false);
    const [currentLevel, setCurrentLevel] = useState(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [rating, setRating] = useState(0);
    const [confettiLoaded, setConfettiLoaded] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [hintsUsed, setHintsUsed] = useState(0);


    // Sound effect for winning
    const winSound = new Audio('https://cdn.pixabay.com/audio/2023/08/07/audio_6d3e8d7971.mp3');

    // Load confetti script on component mount
    useEffect(() => {
        loadConfetti()
            .then(() => {
                setConfettiLoaded(true);
                console.log('Confetti script loaded successfully');
            })
            .catch(error => {
                console.error('Confetti loading failed:', error);
            });
    }, []);

    // Define max attempts and dynamic settings per level
    const levelSettings = [
        { maxAttempts: 15, name: 'Beginner', difficulty: 'Easy' },
        { maxAttempts: 12, name: 'Intermediate', difficulty: 'Medium' },
        { maxAttempts: 10, name: 'Advanced', difficulty: 'Hard' },
        { maxAttempts: 8, name: 'Expert', difficulty: 'Very Hard' },
        { maxAttempts: 10, name: 'Master', difficulty: 'Extreme' },
        { maxAttempts: 9, name: 'Legendary', difficulty: 'Impossible' }
    ];

    // Generate daily seed
    const getDailySeed = () => {
        const today = new Date();
        return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    };

    const mulberry32 = (seed) => {
        return function() {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    };

    // Check if daily challenge was played
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const lastPlayed = localStorage.getItem('lastPlayedDate');
        const storedAttempts = localStorage.getItem('dailyAttempts');
        const storedWon = localStorage.getItem('dailyWon');
        if (lastPlayed === today && (storedAttempts || storedWon)) {
            setHasPlayedDaily(true);
            setAttempts(parseInt(storedAttempts) || 0);
            setGameWon(storedWon === 'true');
            const storedMix = JSON.parse(localStorage.getItem('dailyCurrentMix') || '{"r":128,"g":128,"b":128}');
            setCurrentMix(storedMix);
            const storedHints = parseInt(localStorage.getItem('dailyHintsUsed') || '0');
            setHintsUsed(storedHints);
        }
    }, []);

    // Generate daily or level challenge
    const generateColorChallenge = (isDaily = true, level = null) => {
        const random = mulberry32(isDaily ? getDailySeed() : level);
        const target = {
            r: Math.floor(random() * 200 + 28),
            g: Math.floor(random() * 200 + 28),
            b: Math.floor(random() * 200 + 28)
        };

        return { target };
    };

    // Initialize game
    useEffect(() => {
        if (gameMode === 'daily') {
            const { target } = generateColorChallenge(true);
            setTargetColor(target);
            setCurrentMix({ r: 128, g: 128, b: 128 });
            setAttempts(0);
            setGameWon(false);
            setShowHint(false);
            setHintsUsed(0);
        } else if (gameMode === 'levels' && currentLevel !== null) {
            const { target } = generateColorChallenge(false, currentLevel);
            setTargetColor(target);
            setCurrentMix({ r: 128, g: 128, b: 128 });
            setAttempts(0);
            setGameWon(false);
            setShowHint(false);
            setHintsUsed(0);
        }
    }, [gameMode, currentLevel]);

    // Handle RGB slider changes (no move counter here)
    const handleSliderChange = (channel, value) => {
        if (gameWon || (gameMode === 'daily' && hasPlayedDaily)) return;

        const newMix = { ...currentMix, [channel]: parseInt(value) };
        setCurrentMix(newMix);
    };

    // Check match button - this counts as an attempt
    const handleCheckMatch = () => {
        if (gameWon || attempts >= (gameMode === 'daily' ? 15 : levelSettings[currentLevel]?.maxAttempts) || (gameMode === 'daily' && hasPlayedDaily)) return;

        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        const diff = calculateColorDifference(currentMix, targetColor);
        
        if (diff >= 95) {
            setGameWon(true);
            if (confettiLoaded && window.confetti) {
                window.confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
            winSound.play().catch(error => console.error('Sound playback failed:', error));
            
            if (gameMode === 'daily') {
                const today = new Date().toISOString().split('T')[0];
                localStorage.setItem('lastPlayedDate', today);
                localStorage.setItem('dailyAttempts', newAttempts.toString());
                localStorage.setItem('dailyWon', 'true');
                localStorage.setItem('dailyCurrentMix', JSON.stringify(currentMix));
                localStorage.setItem('dailyHintsUsed', hintsUsed.toString());
                setHasPlayedDaily(true);
            }
        } else if (newAttempts >= (gameMode === 'daily' ? 15 : levelSettings[currentLevel]?.maxAttempts)) {
            if (gameMode === 'daily') {
                const today = new Date().toISOString().split('T')[0];
                localStorage.setItem('lastPlayedDate', today);
                localStorage.setItem('dailyAttempts', newAttempts.toString());
                localStorage.setItem('dailyWon', 'false');
                localStorage.setItem('dailyCurrentMix', JSON.stringify(currentMix));
                localStorage.setItem('dailyHintsUsed', hintsUsed.toString());
                setHasPlayedDaily(true);
            }
        }
    };

    const resetColorMix = () => {
        if (gameMode === 'daily' && hasPlayedDaily) return;
        setCurrentMix({ r: 128, g: 128, b: 128 });
        setAttempts(0);
        setGameWon(false);
        setShowHint(false);
        setHintsUsed(0);
    };

    const calculateColorDifference = (color1, color2) => {
        const diff = Math.sqrt(
            Math.pow(color1.r - color2.r, 2) +
            Math.pow(color1.g - color2.g, 2) +
            Math.pow(color1.b - color2.b, 2)
        );
        return Math.round((1 - diff / 441.67) * 100);
    };

    // Hint system
    const getHintMessage = () => {
        const hints = [];
        const threshold = 30;
        
        if (Math.abs(targetColor.r - currentMix.r) > threshold) {
            hints.push(targetColor.r > currentMix.r ? '🔴 Need more Red' : '🔴 Less Red needed');
        }
        
        if (Math.abs(targetColor.g - currentMix.g) > threshold) {
            hints.push(targetColor.g > currentMix.g ? '🟢 Need more Green' : '🟢 Less Green needed');
        }
        
        if (Math.abs(targetColor.b - currentMix.b) > threshold) {
            hints.push(targetColor.b > currentMix.b ? '🔵 Need more Blue' : '🔵 Less Blue needed');
        }

        if (hints.length === 0) {
            return '✨ You\'re very close! Fine-tune your adjustments.';
        }
        
        return hints.join(' | ');
    };

    const getAccuracyHint = () => {
        const diff = calculateColorDifference(currentMix, targetColor);
        return `🎯 Current Match: ${diff}%`;
    };

    const handleHintClick = () => {
        setShowHint(true);
        setHintsUsed(hintsUsed + 1);
    };

    const shareResults = () => {
        const emoji = gameWon ? '🎯' : '😅';
        const mode = gameMode === 'daily' ? 'Daily Challenge' : `Level ${currentLevel + 1}`;
        const score = gameWon ? `${attempts} attempts` : `X/${gameMode === 'daily' ? 15 : levelSettings[currentLevel].maxAttempts}`;
        const today = new Date().toISOString().split('T')[0];
        const text = `Color Alchemy ${mode} ${emoji}\nScore: ${score}\nHints: ${hintsUsed}\nDate: ${today}\nPlay at: https://color-alchemy-game.vercel.app`;

        navigator.clipboard.writeText(text);
        const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(tweetUrl, '_blank');

        alert('Results copied to clipboard!');
    };

    const handleLevelSelect = (level) => {
        setCurrentLevel(level);
        setGameMode('levels');
    };

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        if (feedback.trim() || rating > 0) {
            const today = new Date().toISOString();
            const formData = new FormData();
            formData.append('entry.1234567890', feedback);
            formData.append('entry.0987654321', today);
            formData.append('entry.1122334455', gameMode);
            formData.append('entry.9876543210', rating.toString());
            console.log('Form Data:', { feedback, timestamp: today, gameMode, rating });

            try {
                const response = await fetch('https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse', {
                    method: 'POST',
                    body: formData
                });
                console.log('Feedback Response:', response);
                setFeedback('');
                setRating(0);
                setShowFeedbackModal(false);
                alert('Thank you for your feedback!');
            } catch (error) {
                console.error('Feedback submission failed:', error);
                alert('Error submitting feedback. Please try again.');
            }
        } else {
            alert('Please provide feedback or a rating.');
        }
    };

    const accuracy = calculateColorDifference(currentMix, targetColor);
    const maxAttempts = gameMode === 'daily' ? 15 : levelSettings[currentLevel]?.maxAttempts || 15;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header with Mode Tabs */}
                <div className="mb-6">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-6">
                        🎨 Color Alchemy
                    </h1>
                    
                    {/* Mode Tabs */}
                    <div className="flex gap-2 bg-white rounded-xl p-2 shadow-md mb-4">
                        <button
                            onClick={() => setGameMode('daily')}
                            className={`flex-1 px-6 py-3 rounded-lg font-bold text-sm transition-all ${
                                gameMode === 'daily' 
                                    ? 'bg-purple-600 text-white shadow-md' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Daily Challenge
                        </button>
                        <button
                            onClick={() => {
                                setGameMode('levels');
                                if (currentLevel === null) setCurrentLevel(0);
                            }}
                            className={`flex-1 px-6 py-3 rounded-lg font-bold text-sm transition-all ${
                                gameMode === 'levels' 
                                    ? 'bg-purple-600 text-white shadow-md' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Levels
                        </button>
                    </div>

                    {/* Level Selection (only visible in levels mode) */}
                    {gameMode === 'levels' && (
                        <div className="bg-white rounded-xl p-4 shadow-md">
                            <h3 className="font-bold text-gray-800 text-sm mb-3">Select Level</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {levelSettings.map((level, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleLevelSelect(index)}
                                        className={`p-3 rounded-lg font-bold text-sm transition-all ${
                                            currentLevel === index 
                                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {level.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Bar */}
                <div className="flex justify-between items-center mb-4 bg-white rounded-xl p-4 shadow-md">
                    <div>
                        <div className="text-2xl font-bold text-gray-800">{attempts}/{maxAttempts}</div>
                        <div className="text-xs text-gray-600">Attempts</div>
                    </div>
                    <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                            {gameMode === 'daily' ? 'Daily' : `Level ${currentLevel + 1}`}
                        </div>
                        <div className="text-xs text-gray-600">
                            {gameMode === 'levels' && levelSettings[currentLevel]?.name}
                        </div>
                    </div>
                    <button
                        onClick={() => setShowFeedbackModal(true)}
                        className="text-gray-600 hover:bg-gray-100 px-3 py-2 rounded-lg transition flex items-center gap-2"
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs font-medium">Feedback</span>
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
                    <div className="text-center mb-6">
                        <p className="text-gray-600 text-sm">Adjust RGB sliders to match the target color</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1 text-center">Target Color</p>
                            <div
                                className="w-full h-24 rounded-lg shadow-lg border-2 border-gray-200"
                                style={{ backgroundColor: `rgb(${targetColor.r}, ${targetColor.g}, ${targetColor.b})` }}
                            />
                            <div className="mt-2 text-center text-xs font-mono bg-gray-100 py-1 rounded">
                                RGB(?, ?, ?)
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1 text-center">Your Mix</p>
                            <div
                                className={`w-full h-24 rounded-lg shadow-lg transition-all duration-300 ${
                                    gameWon ? 'animate-pulse border-4 border-green-500' : accuracy >= 95 ? 'border-4 border-green-500' : 'border-2 border-gray-200'
                                }`}
                                style={{
                                    backgroundColor: `rgb(${currentMix.r}, ${currentMix.g}, ${currentMix.b})`
                                }}
                            />
                            <div className="mt-2 text-center text-xs font-mono bg-gray-100 py-1 rounded">
                                RGB({currentMix.r}, {currentMix.g}, {currentMix.b})
                            </div>
                        </div>
                    </div>




                    {/* Hint Display */}
                    {showHint && !gameWon && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl">
                            <div className="text-yellow-900 text-sm font-medium flex items-center gap-2 mb-2">
                                <Lightbulb className="w-5 h-5" />
                                <span className="font-bold">Hint:</span>
                            </div>
                            <div className="text-yellow-800 text-sm pl-7">
                                {showHint === 'direction' ? getHintMessage() : getAccuracyHint()}
                            </div>
                        </div>
                    )}

                    {!gameWon && attempts < maxAttempts && !(gameMode === 'daily' && hasPlayedDaily) && (
                        <>
                            {/* RGB Sliders */}
                            <div className="space-y-4 mb-4">
                                {/* Red Slider */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="font-semibold text-gray-700 text-sm flex items-center gap-1">
                                            🔴 Red
                                        </label>
                                        <span className="font-mono text-sm bg-red-100 text-red-700 px-3 py-1 rounded-lg">
                                            {currentMix.r}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="255"
                                        value={currentMix.r}
                                        onChange={(e) => handleSliderChange('r', e.target.value)}
                                        className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, rgb(0,${currentMix.g},${currentMix.b}), rgb(255,${currentMix.g},${currentMix.b}))`
                                        }}
                                    />
                                </div>

                                {/* Green Slider */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="font-semibold text-gray-700 text-sm flex items-center gap-1">
                                            🟢 Green
                                        </label>
                                        <span className="font-mono text-sm bg-green-100 text-green-700 px-3 py-1 rounded-lg">
                                            {currentMix.g}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="255"
                                        value={currentMix.g}
                                        onChange={(e) => handleSliderChange('g', e.target.value)}
                                        className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, rgb(${currentMix.r},0,${currentMix.b}), rgb(${currentMix.r},255,${currentMix.b}))`
                                        }}
                                    />
                                </div>

                                {/* Blue Slider */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="font-semibold text-gray-700 text-sm flex items-center gap-1">
                                            🔵 Blue
                                        </label>
                                        <span className="font-mono text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg">
                                            {currentMix.b}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="255"
                                        value={currentMix.b}
                                        onChange={(e) => handleSliderChange('b', e.target.value)}
                                        className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            background: `linear-gradient(to right, rgb(${currentMix.r},${currentMix.g},0), rgb(${currentMix.r},${currentMix.g},255))`
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => {
                                            setShowHint('direction');
                                            setHintsUsed(hintsUsed + 1);
                                        }}
                                        className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold py-3 rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2"
                                    >
                                        <Lightbulb className="w-4 h-4" />
                                        Direction Hint
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowHint('accuracy');
                                            setHintsUsed(hintsUsed + 1);
                                        }}
                                        className="bg-gradient-to-r from-purple-400 to-indigo-500 text-white font-bold py-3 rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2"
                                    >
                                        <Trophy className="w-4 h-4" />
                                        Accuracy Hint
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleCheckMatch}
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        Check Match
                                    </button>
                                    <button
                                        onClick={resetColorMix}
                                        className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2"
                                    >
                                        <Trophy className="w-4 h-4" />
                                        Reset
                                    </button>
                                </div>
                                <div className="text-center text-xs text-gray-500 mt-2">
                                    Hints used: {hintsUsed}
                                </div>
                            </div>
                        </>
                    )}

                    {(gameWon || attempts >= maxAttempts || (gameMode === 'daily' && hasPlayedDaily)) && (
                        <div className={`p-4 rounded-lg text-white text-center ${
                            gameWon ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-pink-500'
                        }`}>
                            <div className="text-3xl mb-2">{gameWon ? '🎨' : '😅'}</div>
                            <div className="text-xl font-bold mb-2">
                                {gameWon ? 'Perfect Match!' : 'Out of Attempts!'}
                            </div>
                            <div className="mb-2 text-sm">
                                {gameWon ? `You solved it in ${attempts} attempts` : `You were ${accuracy}% close`}
                            </div>
                            <div className="mb-4 text-sm">
                                Hints used: {hintsUsed}
                            </div>
                            {gameMode === 'daily' && hasPlayedDaily && (
                                <p className="text-sm mb-4">Come back tomorrow for a new challenge!</p>
                            )}
                            <button
                                onClick={shareResults}
                                className={`bg-white font-bold px-4 py-1 rounded-lg hover:bg-gray-100 transition inline-flex items-center gap-2 ${
                                    gameWon ? 'text-green-600' : 'text-red-600'
                                }`}
                            >
                                <Share2 className="w-3 h-3" />
                                Share Results
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white/80 backdrop-blur rounded-xl p-4 text-gray-700 shadow-md">
                    <div className="flex items-start gap-2">
                        <Lightbulb className="w-5 h-5 flex-shrink-0 mt-0.5 text-purple-600" />
                        <div className="text-sm">
                            <p className="font-semibold mb-1 text-gray-800">How to Play:</p>
                            <p className="text-gray-600">Slide the RGB values freely, then click "Check Match" when ready. Use <span className="font-semibold">Direction Hint</span> for color guidance or <span className="font-semibold">Accuracy Hint</span> to see your match percentage!</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center gap-4 mt-4">
                </div>

                {showFeedbackModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
                            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <MessageSquare className="w-5 h-5" />
                                Feedback
                            </h2>
                            <form onSubmit={handleFeedbackSubmit}>
                                <div className="mb-4">
                                    <label className="block text-gray-700 font-semibold mb-2">Rate your experience</label>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                className={`p-1 ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                            >
                                                <Star className="w-6 h-6 fill-current" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Share your thoughts or suggestions..."
                                    className="w-full h-32 p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none resize-none text-gray-700"
                                />
                                <div className="flex justify-end gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowFeedbackModal(false);
                                            setRating(0);
                                            setFeedback('');
                                        }}
                                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                    >
                                        Submit
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
            <Analytics />
        </div>
    );
};

export default ColorAlchemyGame;