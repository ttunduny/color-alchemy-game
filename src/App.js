import React, { useState, useEffect } from 'react';
import { Calendar, Trophy, Share2, Lock, Droplet, Clock, RotateCcw, Lightbulb } from 'lucide-react';

const ColorAlchemyGame = () => {
    const [gameMode, setGameMode] = useState('menu');
    const [timeGuesses, setTimeGuesses] = useState([]);
    const [yearInput, setYearInput] = useState('');
    const [gameWon, setGameWon] = useState(false);
    const [timeAttempts, setTimeAttempts] = useState(0);
    const [moves, setMoves] = useState(0);

    const [selectedColors, setSelectedColors] = useState([]);
    const [currentMix, setCurrentMix] = useState({ r: 255, g: 255, b: 255 });
    const [palette, setPalette] = useState([]);
    const maxTimeAttempts = 6;
    const maxMoves = 15;

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

    const seed = getDailySeed();
    const random = mulberry32(seed);

    const generateDailyColorChallenge = () => {
        const targetColor = {
            r: Math.floor(random() * 256),
            g: Math.floor(random() * 256),
            b: Math.floor(random() * 256)
        };

        const basePalette = [
            { r: 255, g: 0, b: 0, name: 'Red' },
            { r: 255, g: 165, b: 0, name: 'Orange' },
            { r: 255, g: 255, b: 0, name: 'Yellow' },
            { r: 0, g: 255, b: 0, name: 'Green' },
            { r: 0, g: 0, b: 255, name: 'Blue' },
            { r: 128, g: 0, b: 128, name: 'Purple' },
            { r: 255, g: 255, b: 255, name: 'White' },
            { r: 0, g: 0, b: 0, name: 'Black' },
        ];

        return { target: targetColor, palette: basePalette };
    };

    const dailyColorChallenge = generateDailyColorChallenge();

    useEffect(() => {
        if (gameMode === 'coloralchemy') {
            setPalette(dailyColorChallenge.palette);
            setCurrentMix({ r: 255, g: 255, b: 255 });
            setSelectedColors([]);
            setMoves(0);
            setGameWon(false);
        }
    }, [gameMode]);

    const timeClues = [
        { year: 1929, clues: ['Stock market crash starts Great Depression', 'First Academy Awards', 'Gas: $0.21/gallon', 'St. Valentine\'s Day Massacre'] },
        { year: 1945, clues: ['End of World War II', 'Atomic bombs on Hiroshima and Nagasaki', 'Gas: $0.21/gallon', 'United Nations founded'] },
        { year: 1957, clues: ['Sputnik 1 launched by Soviet Union', 'Little Rock Nine integrate schools', 'Gas: $0.31/gallon', 'Dr. Seuss publishes The Cat in the Hat'] },
        { year: 1963, clues: ['John F. Kennedy assassinated', 'Martin Luther King Jr. \'I Have a Dream\' speech', 'Gas: $0.30/gallon', 'Beatles release first album'] },
        { year: 1969, clues: ['Moon landing', 'Woodstock festival', 'Gas: $0.35/gallon', 'Beatles release Abbey Road'] },
        { year: 1974, clues: ['Richard Nixon resigns over Watergate', 'Patty Hearst kidnapped', 'Gas: $0.53/gallon', 'Rubik\'s Cube invented'] },
        { year: 1986, clues: ['Space Shuttle Challenger explodes', 'Chernobyl nuclear disaster', 'Gas: $0.86/gallon', 'The Oprah Winfrey Show debuts'] },
        { year: 1989, clues: ['Berlin Wall falls', 'Game Boy released', 'Gas: $1.00/gallon', 'Taylor Swift born'] },
        { year: 1991, clues: ['Dissolution of the Soviet Union', 'Gulf War ends', 'Gas: $1.14/gallon', 'World Wide Web becomes public'] },
        { year: 1999, clues: ['Y2K fears', 'The Matrix released', 'Gas: $1.17/gallon', 'Euro currency introduced'] },
        { year: 2001, clues: ['September 11 terrorist attacks', 'Wikipedia launched', 'Gas: $1.46/gallon', 'Apple releases iPod'] },
        { year: 2008, clues: ['iPhone 3G released', 'Barack Obama elected president', 'Gas: $3.27/gallon', 'Bitcoin whitepaper published'] },
        { year: 2011, clues: ['Osama bin Laden killed', 'Arab Spring revolutions', 'Gas: $3.53/gallon', 'Japan earthquake and Fukushima disaster'] },
        { year: 2016, clues: ['Pokémon GO craze', 'Donald Trump elected', 'Gas: $2.20/gallon', 'Brexit vote'] },
        { year: 2020, clues: ['COVID-19 global pandemic begins', 'George Floyd protests', 'Gas: $2.24/gallon', 'Joe Biden elected president'] },
    ];

    const dailyTimeChallenge = timeClues[Math.floor(random() * timeClues.length)];

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
        if (gameWon || moves >= maxMoves) return;

        const newSelected = [...selectedColors, color];
        setSelectedColors(newSelected);
        const newMix = mixColors(newSelected);
        setCurrentMix(newMix);
        setMoves(moves + 1);

        const diff = calculateColorDifference(newMix, dailyColorChallenge.target);
        if (diff >= 95) {
            setGameWon(true);
        }
    };

    const removeLastColor = () => {
        if (selectedColors.length === 0) return;
        const newSelected = selectedColors.slice(0, -1);
        setSelectedColors(newSelected);
        const newMix = mixColors(newSelected);
        setCurrentMix(newMix);
        setMoves(moves - 1);
    };

    const resetColorMix = () => {
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

    const handleTimeGuess = () => {
        if (timeAttempts >= maxTimeAttempts || gameWon) return;

        const year = parseInt(yearInput);
        if (isNaN(year) || year < 1900 || year > 2025) return;

        const difference = Math.abs(year - dailyTimeChallenge.year);
        const direction = year > dailyTimeChallenge.year ? 'high' : 'low';
        const cluesRevealed = Math.min(timeAttempts + 1, dailyTimeChallenge.clues.length);

        setTimeGuesses([...timeGuesses, { year, difference, direction, cluesRevealed }]);
        setTimeAttempts(timeAttempts + 1);
        setYearInput('');

        if (difference === 0) {
            setGameWon(true);
        }
    };

    const resetTimeGame = () => {
        setTimeGuesses([]);
        setYearInput('');
        setGameWon(false);
        setTimeAttempts(0);
    };

    const shareResults = () => {
        const emoji = gameWon ? '🎯' : '😅';
        const game = gameMode === 'coloralchemy' ? 'Color Alchemy' : 'TimeSlice';
        const score = gameMode === 'coloralchemy'
            ? `${moves} moves`
            : gameWon ? `${timeAttempts}/${maxTimeAttempts}` : 'X/6';
        const text = `${game} Daily Challenge ${emoji} ${score}\n\nPlay at: [your-game-url]`;
        navigator.clipboard.writeText(text);
        alert('Results copied to clipboard!');
    };

    if (gameMode === 'menu') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 p-8 flex items-center justify-center">
                <div className="max-w-4xl w-full">
                    <div className="text-center mb-12">
                        <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
                            Daily Challenge
                        </h1>
                        <p className="text-xl text-white/90">Choose your game mode</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <button
                            onClick={() => setGameMode('coloralchemy')}
                            className="bg-white rounded-3xl p-8 shadow-2xl hover:scale-105 transition-transform duration-200 group"
                        >
                            <div className="flex items-center justify-center mb-4">
                                <Droplet className="w-16 h-16 text-purple-600 group-hover:rotate-12 transition-transform" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-3">Color Alchemy</h2>
                            <p className="text-gray-600 mb-4">Mix colors from an expanded palette to match the target. Add multiples for precise control!</p>
                            <div className="flex items-center justify-center gap-2 text-sm text-purple-600 font-semibold">
                                <Calendar className="w-4 h-4" />
                                <span>Daily Challenge Available</span>
                            </div>
                        </button>

                        <button
                            onClick={() => { setGameMode('timeslice'); resetTimeGame(); }}
                            className="bg-white rounded-3xl p-8 shadow-2xl hover:scale-105 transition-transform duration-200 group"
                        >
                            <div className="flex items-center justify-center mb-4">
                                <Clock className="w-16 h-16 text-pink-600 group-hover:rotate-12 transition-transform" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-3">TimeSlice</h2>
                            <p className="text-gray-600 mb-4">Guess the year from historical clues. Get direction feedback on guesses!</p>
                            <div className="flex items-center justify-center gap-2 text-sm text-pink-600 font-semibold">
                                <Calendar className="w-4 h-4" />
                                <span>Daily Challenge Available</span>
                            </div>
                        </button>
                    </div>

                    <div className="mt-12 bg-white/20 backdrop-blur rounded-2xl p-6 text-white">
                        <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                            <Trophy className="w-6 h-6" />
                            Coming Soon: Level Packs
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-white/20 rounded-lg p-3 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                <span className="text-sm">Famous Paintings</span>
                            </div>
                            <div className="bg-white/20 rounded-lg p-3 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                <span className="text-sm">Brand Colors</span>
                            </div>
                            <div className="bg-white/20 rounded-lg p-3 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                <span className="text-sm">80s Era</span>
                            </div>
                            <div className="bg-white/20 rounded-lg p-3 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                <span className="text-sm">Tech History</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (gameMode === 'coloralchemy') {
        const accuracy = calculateColorDifference(currentMix, dailyColorChallenge.target);

        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-600 p-4 md:p-6">
                <div className="max-w-2xl mx-auto">
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={() => setGameMode('menu')}
                            className="text-white hover:bg-white/20 px-3 py-1 rounded-lg transition"
                        >
                            ← Back
                        </button>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Color Alchemy</h1>
                        <div className="text-white font-bold">Moves: {moves}/{maxMoves}</div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-2xl p-4 md:p-6 mb-4">
                        <div className="text-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800 mb-2">Daily Challenge</h2>
                            <p className="text-gray-600 text-sm">Mix colors to match the target</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <p className="text-xs font-semibold text-gray-600 mb-1 text-center">Target Color</p>
                                <div
                                    className="w-full h-24 rounded-lg shadow-lg border-2 border-gray-200"
                                    style={{ backgroundColor: `rgb(${dailyColorChallenge.target.r}, ${dailyColorChallenge.target.g}, ${dailyColorChallenge.target.b})` }}
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

                        {!gameWon && moves < maxMoves && (
                            <>
                                <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-bold text-gray-800 text-sm">Color Palette</h3>
                                        <button
                                            onClick={removeLastColor}
                                            disabled={selectedColors.length === 0}
                                            className="text-xs text-purple-600 hover:text-purple-800 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center gap-1"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            Undo
                                        </button>
                                    </div>
                                    {/* Color palette buttons reduced from w-10 h-10 to w-8 h-8 */}
                                    <div className="grid grid-cols-4 gap-1">
                                        {palette.map((color, i) => (
                                            <button
                                                key={i}
                                                onClick={() => addColorToPalette(color)}
                                                className="w-8 h-8 rounded-md shadow hover:scale-105 transition-transform duration-200 border-2 border-white hover:border-purple-400 relative group"
                                                style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
                                            >
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-md">
                                                    <span className="text-white font-bold text-[10px]">{color.name}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="font-bold text-gray-800 text-sm mb-2">Mixed Colors ({selectedColors.length})</h3>
                                    {/* Mixed colors reduced from w-10 h-10 to w-8 h-8 */}
                                    <div className="flex flex-wrap gap-1 min-h-[2rem] bg-gray-50 rounded-lg p-2">
                                        {selectedColors.length === 0 ? (
                                            <p className="text-gray-400 text-xs">Select colors above to start mixing...</p>
                                        ) : (
                                            selectedColors.map((color, i) => (
                                                <div
                                                    key={i}
                                                    className="w-8 h-8 rounded-md shadow border-2 border-white"
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
                                    <RotateCcw className="w-4 h-4" />
                                    Reset Mix
                                </button>
                            </>
                        )}

                        {gameWon && (
                            <div className="bg-gradient-to-r from-green-400 to-emerald-500 p-4 rounded-lg text-white text-center">
                                <div className="text-3xl mb-2">🎨</div>
                                <div className="text-xl font-bold mb-2">Perfect Match!</div>
                                <div className="mb-4 text-sm">You solved it in {moves} moves</div>
                                <button
                                    onClick={shareResults}
                                    className="bg-white text-green-600 px-4 py-1 rounded-lg font-bold hover:bg-gray-100 transition inline-flex items-center gap-2"
                                >
                                    <Share2 className="w-3 h-3" />
                                    Share Results
                                </button>
                            </div>
                        )}

                        {!gameWon && moves >= maxMoves && (
                            <div className="bg-gradient-to-r from-red-400 to-pink-500 p-4 rounded-lg text-white text-center">
                                <div className="text-3xl mb-2">😅</div>
                                <div className="text-xl font-bold mb-2">Out of Moves!</div>
                                <div className="mb-2 text-sm">You were {accuracy}% close</div>
                                <button
                                    onClick={resetColorMix}
                                    className="mt-4 bg-white text-red-600 px-4 py-1 rounded-lg font-bold hover:bg-gray-100 transition"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-white">
                        <div className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 flex-shrink-0 mt-1" />
                            <div className="text-xs">
                                <p className="font-semibold mb-1">Pro Tip:</p>
                                <p className="text-white/90">Colors mix by averaging their components, like mixing paints. Click the same color multiple times to weight the mix!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (gameMode === 'timeslice') {
        const cluesRevealed = Math.min(timeAttempts, dailyTimeChallenge.clues.length);

        return (
            <div className="min-h-screen bg-gradient-to-br from-pink-600 to-orange-500 p-4 md:p-8">
                <div className="max-w-2xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <button
                            onClick={() => setGameMode('menu')}
                            className="text-white hover:bg-white/20 px-4 py-2 rounded-lg transition"
                        >
                            ← Back
                        </button>
                        <h1 className="text-3xl md:text-4xl font-bold text-white">TimeSlice</h1>
                        <div className="text-white font-bold">{timeAttempts}/{maxTimeAttempts}</div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 mb-6">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Daily Challenge</h2>
                            <p className="text-gray-600">Guess the year from these cultural clues</p>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl p-6 mb-6">
                            <h3 className="font-bold text-lg mb-4 text-gray-800">Clues:</h3>
                            <div className="space-y-3">
                                {dailyTimeChallenge.clues.slice(0, cluesRevealed).map((clue, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                                            {i + 1}
                                        </div>
                                        <div className="text-gray-700 flex-1">{clue}</div>
                                    </div>
                                ))}
                                {cluesRevealed < dailyTimeChallenge.clues.length && (
                                    <div className="flex items-start gap-3 opacity-40">
                                        <div className="bg-gray-300 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-sm font-bold">
                                            {cluesRevealed + 1}
                                        </div>
                                        <div className="text-gray-400 flex-1">🔒 Locked - Make another guess to reveal</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {!gameWon && timeAttempts < maxTimeAttempts && (
                            <div className="mb-6">
                                <input
                                    type="number"
                                    value={yearInput}
                                    onChange={(e) => setYearInput(e.target.value)}
                                    placeholder="Enter year (1900-2025)"
                                    className="w-full px-4 py-3 text-xl text-center border-2 border-gray-300 rounded-xl mb-3 focus:border-pink-500 focus:outline-none"
                                    onKeyPress={(e) => e.key === 'Enter' && handleTimeGuess()}
                                />
                                <button
                                    onClick={handleTimeGuess}
                                    className="w-full bg-gradient-to-r from-pink-600 to-orange-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition"
                                >
                                    Submit Guess
                                </button>
                            </div>
                        )}

                        <div className="space-y-2">
                            {timeGuesses.map((guess, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl font-bold text-gray-800">{guess.year}</div>
                                        <div className="text-sm text-gray-600">
                                            {guess.difference === 0 ? (
                                                <span className="text-green-600 font-bold">🎯 Correct!</span>
                                            ) : (
                                                <span>
                          {guess.difference} year{guess.difference !== 1 ? 's' : ''} off (too {guess.direction === 'high' ? 'recent' : 'early'})
                        </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-2xl">
                                        {guess.difference === 0 ? '🎉' :
                                            guess.difference <= 5 ? '🔥' :
                                                guess.difference <= 15 ? '🌡️' : '❄️'}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {gameWon && (
                            <div className="mt-6 bg-gradient-to-r from-green-400 to-emerald-500 p-6 rounded-xl text-white text-center">
                                <div className="text-4xl mb-2">🎉</div>
                                <div className="text-2xl font-bold mb-2">Perfect! You got it!</div>
                                <div className="text-xl mb-4">The year was {dailyTimeChallenge.year}</div>
                                <div className="mb-4">Solved in {timeAttempts} attempts</div>
                                <button
                                    onClick={shareResults}
                                    className="bg-white text-green-600 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition inline-flex items-center gap-2"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share Results
                                </button>
                            </div>
                        )}

                        {!gameWon && timeAttempts >= maxTimeAttempts && (
                            <div className="mt-6 bg-gradient-to-r from-red-400 to-pink-500 p-6 rounded-xl text-white text-center">
                                <div className="text-4xl mb-2">😅</div>
                                <div className="text-2xl font-bold mb-2">Out of Attempts</div>
                                <div className="text-xl">The year was {dailyTimeChallenge.year}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }
};

export default ColorAlchemyGame;