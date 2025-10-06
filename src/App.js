import React, { useState, useEffect } from 'react';
import { Droplet, Share2, Lightbulb, Trophy, MessageSquare, Star } from 'lucide-react';
import { Analytics } from '@vercel/analytics/react';

const ColorAlchemyGame = () => {
    const [gameMode, setGameMode] = useState('daily');
    const [selectedColors, setSelectedColors] = useState([]);
    const [currentMix, setCurrentMix] = useState({ r: 255, g: 255, b: 255 });
    const [palette, setPalette] = useState([]);
    const [targetColor, setTargetColor] = useState({ r: 255, g: 255, b: 255 });
    const [moves, setMoves] = useState(0);
    const [gameWon, setGameWon] = useState(false);
    const [hasPlayedDaily, setHasPlayedDaily] = useState(false);
    const [currentLevel, setCurrentLevel] = useState(null);
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [rating, setRating] = useState(0);

    // Define max moves per level
    const levelSettings = [
        { maxMoves: 15, name: 'Beginner (Pastel)' },
        { maxMoves: 12, name: 'Intermediate (Neon)' },
        { maxMoves: 10, name: 'Advanced (Earthy)' },
        { maxMoves: 8, name: 'Expert (Monochrome)' },
        { maxMoves: 10, name: 'Master (Vibrant)' },
        { maxMoves: 9, name: 'Legendary (Random)' }
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
        const storedMoves = localStorage.getItem('dailyMoves');
        const storedWon = localStorage.getItem('dailyWon');
        if (lastPlayed === today && (storedMoves || storedWon)) {
            setHasPlayedDaily(true);
            setMoves(parseInt(storedMoves) || 0);
            setGameWon(storedWon === 'true');
            const storedColors = JSON.parse(localStorage.getItem('dailySelectedColors') || '[]');
            const storedMix = JSON.parse(localStorage.getItem('dailyCurrentMix') || '{"r":255,"g":255,"b":255}');
            setSelectedColors(storedColors);
            setCurrentMix(storedMix);
        }
    }, []);

    // Generate daily or level challenge
    const generateColorChallenge = (isDaily = true, level = null) => {
        const random = mulberry32(isDaily ? getDailySeed() : level);
        const target = {
            r: Math.floor(random() * 256),
            g: Math.floor(random() * 256),
            b: Math.floor(random() * 256)
        };

        // Base palette for daily mode
        const basePalette = [
            { r: 255, g: 0, b: 0, name: 'Red' },
            { r: 255, g: 165, b: 0, name: 'Orange' },
            { r: 255, g: 255, b: 0, name: 'Yellow' },
            { r: 0, g: 255, b: 0, name: 'Green' },
            { r: 0, g: 0, b: 255, name: 'Blue' },
            { r: 128, g: 0, b: 128, name: 'Purple' },
            { r: 255, g: 255, b: 255, name: 'White' },
            { r: 0, g: 0, b: 0, name: 'Black' }
        ];

        // Thematic palettes for levels
        const pastelPalette = [
            { r: 255, g: 182, b: 193, name: 'Baby Pink' },
            { r: 173, g: 216, b: 230, name: 'Light Blue' },
            { r: 245, g: 245, b: 220, name: 'Beige' },
            { r: 152, g: 251, b: 152, name: 'Pale Green' },
            { r: 240, g: 230, b: 140, name: 'Khaki' },
            { r: 221, g: 160, b: 221, name: 'Plum' },
            { r: 245, g: 222, b: 179, name: 'Wheat' },
            { r: 255, g: 245, b: 238, name: 'Seashell' }
        ];

        const neonPalette = [
            { r: 255, g: 0, b: 255, name: 'Magenta' },
            { r: 0, g: 255, b: 255, name: 'Cyan' },
            { r: 255, g: 255, b: 0, name: 'Neon Yellow' },
            { r: 0, g: 255, b: 0, name: 'Neon Green' },
            { r: 255, g: 69, b: 0, name: 'Neon Orange' },
            { r: 138, g: 43, b: 226, name: 'Electric Purple' },
            { r: 255, g: 20, b: 147, name: 'Hot Pink' }
        ];

        const earthyPalette = [
            { r: 139, g: 69, b: 19, name: 'Saddle Brown' },
            { r: 107, g: 142, b: 35, name: 'Olive' },
            { r: 160, g: 82, b: 45, name: 'Sienna' },
            { r: 85, g: 107, b: 47, name: 'Dark Olive' },
            { r: 210, g: 180, b: 140, name: 'Tan' },
            { r: 189, g: 183, b: 107, name: 'Dark Khaki' },
            { r: 143, g: 188, b: 143, name: 'Sea Green' },
            { r: 205, g: 133, b: 63, name: 'Peru' },
            { r: 244, g: 164, b: 96, name: 'Sandy Brown' }
        ];

        const monochromePalette = [
            { r: 255, g: 255, b: 255, name: 'White' },
            { r: 192, g: 192, b: 192, name: 'Silver' },
            { r: 128, g: 128, b: 128, name: 'Gray' },
            { r: 64, g: 64, b: 64, name: 'Dark Gray' },
            { r: 32, g: 32, b: 32, name: 'Charcoal' },
            { r: 0, g: 0, b: 0, name: 'Black' }
        ];

        const vibrantPalette = [
            { r: 255, g: 0, b: 0, name: 'Red' },
            { r: 0, g: 255, b: 0, name: 'Green' },
            { r: 0, g: 0, b: 255, name: 'Blue' },
            { r: 255, g: 255, b: 0, name: 'Yellow' },
            { r: 255, g: 105, b: 180, name: 'Pink' },
            { r: 0, g: 255, b: 255, name: 'Cyan' },
            { r: 255, g: 165, b: 0, name: 'Orange' },
            { r: 148, g: 0, b: 211, name: 'Violet' }
        ];

        const allColors = [...basePalette, ...pastelPalette, ...neonPalette, ...earthyPalette, ...monochromePalette, ...vibrantPalette];
        const randomPalette = Array.from({ length: 7 }, () => allColors[Math.floor(random() * allColors.length)]);

        // Select palette based on level
        if (!isDaily && level !== null) {
            const palettes = [pastelPalette, neonPalette, earthyPalette, monochromePalette, vibrantPalette, randomPalette];
            return { target, palette: palettes[level] };
        }

        return { target, palette: basePalette };
    };

    // Initialize game
    useEffect(() => {
        if (gameMode === 'daily') {
            const { target, palette } = generateColorChallenge(true);
            setTargetColor(target);
            setPalette(palette);
            setSelectedColors([]);
            setCurrentMix({ r: 255, g: 255, b: 255 });
            setMoves(0);
            setGameWon(false);
        } else if (gameMode === 'levels' && currentLevel !== null) {
            const { target, palette } = generateColorChallenge(false, currentLevel);
            setTargetColor(target);
            setPalette(palette);
            setSelectedColors([]);
            setCurrentMix({ r: 255, g: 255, b: 255 });
            setMoves(0);
            setGameWon(false);
        }
    }, [gameMode, currentLevel]);

    // Color mixing logic
    const mixColors = (colors) => {
        if (colors.length === 0) return { r: 255, g: 255, b: 255 };

        let r = 0, g = 0, b = 0;
        colors.forEach(color => {
            r += color.r;
            g += color.g;
            b += color.b;
        });

        return {
            r: Math.min(255, Math.floor(r / colors.length)),
            g: Math.min(255, Math.floor(g / colors.length)),
            b: Math.min(255, Math.floor(b / colors.length))
        };
    };

    const addColorToPalette = (color) => {
        if (gameWon || moves >= (gameMode === 'daily' ? 15 : levelSettings[currentLevel].maxMoves) || (gameMode === 'daily' && hasPlayedDaily)) return;

        const newSelected = [...selectedColors, color];
        setSelectedColors(newSelected);
        const newMix = mixColors(newSelected);
        setCurrentMix(newMix);
        setMoves(moves + 1);

        const diff = calculateColorDifference(newMix, targetColor);
        if (diff >= 95) {
            setGameWon(true);
            if (gameMode === 'daily') {
                const today = new Date().toISOString().split('T')[0];
                localStorage.setItem('lastPlayedDate', today);
                localStorage.setItem('dailyMoves', moves + 1);
                localStorage.setItem('dailyWon', 'true');
                localStorage.setItem('dailySelectedColors', JSON.stringify(newSelected));
                localStorage.setItem('dailyCurrentMix', JSON.stringify(newMix));
                setHasPlayedDaily(true);
            }
        } else if (moves + 1 >= (gameMode === 'daily' ? 15 : levelSettings[currentLevel].maxMoves) && gameMode === 'daily') {
            const today = new Date().toISOString().split('T')[0];
            localStorage.setItem('lastPlayedDate', today);
            localStorage.setItem('dailyMoves', moves + 1);
            localStorage.setItem('dailyWon', 'false');
            localStorage.setItem('dailySelectedColors', JSON.stringify(newSelected));
            localStorage.setItem('dailyCurrentMix', JSON.stringify(newMix));
            setHasPlayedDaily(true);
        }
    };

    const resetColorMix = () => {
        if (gameMode === 'daily' && hasPlayedDaily) return;
        setSelectedColors([]);
        setCurrentMix({ r: 255, g: 255, b: 255 });
        setMoves(0);
        setGameWon(false);
    };

    const calculateColorDifference = (color1, color2) => {
        const diff = Math.sqrt(
            Math.pow(color1.r - color2.r, 2) +
            Math.pow(color1.g - color2.g, 2) +
            Math.pow(color1.b - color2.b, 2)
        );
        return Math.round((1 - diff / 441.67) * 100);
    };

    const shareResults = () => {
        const emoji = gameWon ? '🎯' : '😅';
        const mode = gameMode === 'daily' ? 'Daily Challenge' : `Level ${currentLevel + 1}`;
        const score = gameWon ? `${moves} moves` : `X/${gameMode === 'daily' ? 15 : levelSettings[currentLevel].maxMoves}`;
        const today = new Date().toISOString().split('T')[0];
        const text = `Color Alchemy ${mode} ${emoji}\nScore: ${score}\nDate: ${today}\nPlay at: https://color-alchemy-game.vercel.app`;

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
            formData.append('entry.1714569215', feedback); // Replace with your Google Form Feedback field ID
            formData.append('entry.89785459', today); // Replace with your Google Form Timestamp field ID
            formData.append('entry.1130434173', gameMode); // Replace with your Google Form Game Mode field ID
            formData.append('entry.283003954', rating.toString()); // Replace with your Google Form Rating field ID

            try {
                await fetch('https://docs.google.com/forms/d/e/1FAIpQLSc8XvCmItL6BnF5E7owROlMvc-RDNTMfx0dkiVD86V0L3oe7Q/formResponse', {
                    method: 'POST',
                    mode: 'no-cors',
                    body: formData
                });
                setFeedback('');
                setRating(0);
                setShowFeedbackModal(false);
                alert('Thank you for your feedback!');
            } catch (error) {
                console.error('Feedback submission failed:', error);
                alert('Error submitting feedback. Please try again.');
            }
        }
    };

    const accuracy = calculateColorDifference(currentMix, targetColor);

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-600 p-4 md:p-6">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                        Color Alchemy {gameMode === 'daily' ? 'Daily Challenge' : `Level ${currentLevel + 1}`}
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="text-white font-bold">Moves: {moves}/{gameMode === 'daily' ? 15 : levelSettings[currentLevel]?.maxMoves}</div>
                        <button
                            onClick={() => setShowFeedbackModal(true)}
                            className="text-white hover:bg-white/20 px-3 py-1 rounded-lg transition flex items-center gap-1"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Feedback
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 mb-4">
                    <div className="text-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            {gameMode === 'daily' ? 'Daily Challenge' : levelSettings[currentLevel]?.name}
                        </h2>
                        <p className="text-gray-600 text-sm">Mix colors to match the target</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1 text-center">Target Color</p>
                            <div
                                className="w-full h-24 rounded-lg shadow-lg border-2 border-gray-200"
                                style={{ backgroundColor: `rgb(${targetColor.r}, ${targetColor.g}, ${targetColor.b})` }}
                            />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-600 mb-1 text-center">Your Mix</p>
                            <div
                                className="w-full h-24 rounded-lg shadow-lg border-2 transition-all duration-300"
                                style={{
                                    backgroundColor: `rgb(${currentMix.r}, ${currentMix.g}, ${currentMix.b})`,
                                    borderColor: accuracy >= 95 ? '#10b981' : accuracy >= 70 ? '#f59e0b' : '#ef4444'
                                }}
                            />
                        </div>
                    </div>

                    <div className="mb-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-700 text-sm">Match Accuracy</span>
                            <span className="text-xl font-bold" style={{
                                color: accuracy >= 95 ? '#10b981' : accuracy >= 70 ? '#f59e0b' : '#ef4444'
                            }}>
                {accuracy}%
              </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="h-2 rounded-full transition-all duration-300"
                                style={{
                                    width: `${accuracy}%`,
                                    backgroundColor: accuracy >= 95 ? '#10b981' : accuracy >= 70 ? '#f59e0b' : '#ef4444'
                                }}
                            />
                        </div>
                    </div>

                    {gameMode === 'levels' && (
                        <div className="mb-4">
                            <h3 className="font-bold text-gray-800 text-sm mb-2">Select Level</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {levelSettings.map((level, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleLevelSelect(index)}
                                        className={`p-2 rounded-lg font-bold text-sm ${
                                            currentLevel === index ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                        }`}
                                    >
                                        {level.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!gameWon && moves < (gameMode === 'daily' ? 15 : levelSettings[currentLevel]?.maxMoves) && !(gameMode === 'daily' && hasPlayedDaily) && (
                        <>
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-bold text-gray-800 text-sm">Color Palette</h3>
                                    <button
                                        onClick={resetColorMix}
                                        className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                                    >
                                        <Trophy className="w-3 h-3" />
                                        Reset
                                    </button>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {palette.map((color, i) => (
                                        <button
                                            key={i}
                                            onClick={() => addColorToPalette(color)}
                                            className="w-10 h-10 rounded-lg shadow hover:scale-105 transition-transform duration-200 border-2 border-white hover:border-purple-400 relative group"
                                            style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
                                        >
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                                                <span className="text-white font-bold text-xs">{color.name}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-4">
                                <h3 className="font-bold text-gray-800 text-sm mb-2">Mixed Colors ({selectedColors.length})</h3>
                                <div className="flex flex-wrap gap-2 min-h-[2.5rem] bg-gray-50 rounded-lg p-2">
                                    {selectedColors.length === 0 ? (
                                        <p className="text-gray-400 text-xs">Select colors above to start mixing...</p>
                                    ) : (
                                        selectedColors.map((color, i) => (
                                            <div
                                                key={i}
                                                className="w-10 h-10 rounded-lg shadow border-2 border-white"
                                                style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={resetColorMix}
                                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold py-2 rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2"
                            >
                                <Trophy className="w-4 h-4" />
                                Reset Mix
                            </button>
                        </>
                    )}

                    {(gameWon || moves >= (gameMode === 'daily' ? 15 : levelSettings[currentLevel]?.maxMoves) || (gameMode === 'daily' && hasPlayedDaily)) && (
                        <div className={`p-4 rounded-lg text-white text-center ${
                            gameWon ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-pink-500'
                        }`}>
                            <div className="text-3xl mb-2">{gameWon ? '🎨' : '😅'}</div>
                            <div className="text-xl font-bold mb-2">
                                {gameWon ? 'Perfect Match!' : 'Out of Moves!'}
                            </div>
                            <div className="mb-4 text-sm">
                                {gameWon ? `You solved it in ${moves} moves` : `You were ${accuracy}% close`}
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

                <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-white">
                    <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 flex-shrink-0 mt-1" />
                        <div className="text-xs">
                            <p className="font-semibold mb-1">Pro Tip:</p>
                            <p className="text-white/90">Colors mix by averaging their components. Click the same color multiple times to weight the mix!</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center gap-4 mt-4">
                    <button
                        onClick={() => setGameMode('daily')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm ${
                            gameMode === 'daily' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-gray-100'
                        }`}
                    >
                        Daily Challenge
                    </button>
                    <button
                        onClick={() => setGameMode('levels')}
                        className={`px-4 py-2 rounded-lg font-bold text-sm ${
                            gameMode === 'levels' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-gray-100'
                        }`}
                    >
                        Levels
                    </button>
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