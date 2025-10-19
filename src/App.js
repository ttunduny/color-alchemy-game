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
    const [targetColors, setTargetColors] = useState([{ r: 255, g: 255, b: 255 }]);
    const [currentColorIndex, setCurrentColorIndex] = useState(0);
    const [unlockedLevels, setUnlockedLevels] = useState([0]); // Level 1 is always unlocked
    const [currentPage, setCurrentPage] = useState(0);
    const levelsPerPage = 10;
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
    const [showShareModal, setShowShareModal] = useState(false);


    // Sound effect for winning - using Web Audio API for a simple beep
    const playWinSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Audio not available:', error);
        }
    };

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

    // Generate 50 levels with progressive difficulty
    const generateLevelSettings = () => {
        const levels = [];
        
        // Single color levels (1-15) - Foundation
        for (let i = 0; i < 15; i++) {
            const levelNum = i + 1;
            const difficulty = i < 5 ? 'Very Easy' : i < 10 ? 'Easy' : 'Easy+';
            const maxAttempts = Math.max(6, 30 - i * 1.5);
            const min = Math.max(0, 50 - i * 2);
            const max = Math.min(255, 100 + i * 8);
            const step = i < 5 ? 5 : i < 10 ? 3 : 2;
            
            levels.push({
                level: levelNum,
                maxAttempts: Math.floor(maxAttempts),
                name: `Level ${levelNum}`,
                difficulty,
                colorCount: 1,
                colorRange: { min, max, step },
                description: `Foundation level ${levelNum}`
            });
        }
        
        // Intermediate single color levels (16-25) - Precision
        for (let i = 15; i < 25; i++) {
            const levelNum = i + 1;
            const difficulty = i < 20 ? 'Medium' : 'Medium+';
            const maxAttempts = Math.max(4, 20 - (i - 15) * 1.2);
            const min = Math.max(0, 20 - (i - 15) * 1);
            const max = Math.min(255, 200 + (i - 15) * 2);
            const step = i < 20 ? 2 : 1;
            
            levels.push({
                level: levelNum,
                maxAttempts: Math.floor(maxAttempts),
                name: `Level ${levelNum}`,
                difficulty,
                colorCount: 1,
                colorRange: { min, max, step },
                description: `Precision level ${levelNum}`
            });
        }
        
        // Advanced single color levels (26-30) - Mastery
        for (let i = 25; i < 30; i++) {
            const levelNum = i + 1;
            const difficulty = i < 28 ? 'Hard' : 'Expert';
            const maxAttempts = Math.max(3, 12 - (i - 25) * 1.5);
            
            levels.push({
                level: levelNum,
                maxAttempts: Math.floor(maxAttempts),
                name: `Level ${levelNum}`,
                difficulty,
                colorCount: 1,
                colorRange: { min: 0, max: 255, step: 1 },
                description: `Mastery level ${levelNum}`
            });
        }
        
        // Multi-color levels (31-50) - Advanced challenges
        for (let i = 30; i < 50; i++) {
            const levelNum = i + 1;
            const colorCount = Math.min(8, Math.floor((i - 30) / 2.5) + 2);
            const difficulty = colorCount <= 3 ? 'Multi-Color' : 
                             colorCount <= 5 ? 'Advanced' : 
                             colorCount <= 7 ? 'Expert' : 'Legendary';
            const maxAttempts = Math.max(3, 15 - (i - 30) * 0.4);
            const min = Math.max(0, 10 - (i - 30) * 0.2);
            const max = 255;
            
            levels.push({
                level: levelNum,
                maxAttempts: Math.floor(maxAttempts),
                name: `Level ${levelNum}`,
                difficulty,
                colorCount,
                colorRange: { min: Math.floor(min), max, step: 1 },
                description: `${colorCount} color challenge`
            });
        }
        
        return levels;
    };
    
    const levelSettings = generateLevelSettings();

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

    // Check if daily challenge was played and load unlocked levels
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
        
        // Load unlocked levels
        const storedUnlockedLevels = localStorage.getItem('unlockedLevels');
        if (storedUnlockedLevels) {
            setUnlockedLevels(JSON.parse(storedUnlockedLevels));
        }
    }, []);

    // Generate daily or level challenge with progressive difficulty
    const generateColorChallenge = (isDaily = true, level = null) => {
        // Use timestamp for more dynamic colors, even for the same level
        const timestamp = Date.now();
        const randomOffset = Math.floor(Math.random() * 100000);
        const seed = isDaily ? getDailySeed() : (level * 100000 + timestamp + randomOffset);
        console.log(`Generating colors with seed: ${seed} for level ${level + 1}`);
        const random = mulberry32(seed);
        
        if (isDaily) {
            // Daily challenge uses medium difficulty
        const target = {
            r: Math.floor(random() * 200 + 28),
            g: Math.floor(random() * 200 + 28),
            b: Math.floor(random() * 200 + 28)
        };
            return { target, targets: [target] };
        } else {
            // Level-based challenge uses progressive difficulty
            // level is 0-indexed, so level 1 = index 0, level 2 = index 1, etc.
            const levelConfig = levelSettings[level];
            if (!levelConfig) {
                // Fallback to first level if invalid level
                const fallbackConfig = levelSettings[0];
                const { min, max, step } = fallbackConfig.colorRange;
                const { colorCount } = fallbackConfig;
                const generateColorValue = () => {
                    const range = max - min;
                    const steps = Math.floor(range / step);
                    const randomStep = Math.floor(random() * (steps + 1));
                    return min + (randomStep * step);
                };
                const generateSingleColor = () => ({
                    r: generateColorValue(),
                    g: generateColorValue(),
                    b: generateColorValue()
                });
                const targets = [];
                for (let i = 0; i < colorCount; i++) {
                    targets.push(generateSingleColor());
                }
                return { target: targets[0], targets };
            }
            const { min, max, step } = levelConfig.colorRange;
            const { colorCount } = levelConfig;
            console.log(`Level ${level + 1} config:`, { min, max, step, colorCount });
            console.log(`Level config object:`, levelConfig);
            console.log(`Color count: ${colorCount}, type: ${typeof colorCount}`);
            
            // Generate colors within the level's range
            const generateColorValue = () => {
                const range = max - min;
                const steps = Math.floor(range / step);
                const randomStep = Math.floor(random() * (steps + 1));
                const value = min + (randomStep * step);
                console.log(`Generated color value: ${value} (range: ${min}-${max}, step: ${step})`);
                return value;
            };
            
            // Add some randomness to ensure different colors each time
            const addRandomVariation = (value) => {
                const variation = Math.floor(random() * 3) - 1; // -1, 0, or 1
                return Math.max(min, Math.min(max, value + variation));
            };
            
            const generateSingleColor = () => ({
                r: addRandomVariation(generateColorValue()),
                g: addRandomVariation(generateColorValue()),
                b: addRandomVariation(generateColorValue())
            });
            
            // Generate multiple colors for multi-color levels
            const targets = [];
            console.log(`Generating ${colorCount} colors for level ${level + 1}`);
            for (let i = 0; i < colorCount; i++) {
                const color = generateSingleColor();
                console.log(`Generated color ${i + 1}:`, color);
                targets.push(color);
            }
            
            console.log(`Generated colors for level ${level + 1}:`, targets);
            return { target: targets[0], targets };
        }
    };

    // Initialize game
    useEffect(() => {
        if (gameMode === 'daily') {
            const { target, targets } = generateColorChallenge(true);
            if (target && targets) {
            setTargetColor(target);
                setTargetColors(targets);
            setCurrentMix({ r: 128, g: 128, b: 128 });
                setCurrentColorIndex(0);
            setAttempts(0);
            setGameWon(false);
            setShowHint(false);
            setHintsUsed(0);
            }
        } else if (gameMode === 'levels' && currentLevel !== null) {
            const { target, targets } = generateColorChallenge(false, currentLevel);
            if (target && targets) {
            setTargetColor(target);
                setTargetColors(targets);
            setCurrentMix({ r: 128, g: 128, b: 128 });
                setCurrentColorIndex(0);
            setAttempts(0);
            setGameWon(false);
            setShowHint(false);
            setHintsUsed(0);
            }
        }
    }, [gameMode, currentLevel]);

    // Handle RGB slider changes with mobile optimization
    const handleSliderChange = (channel, value) => {
        if (gameWon || (gameMode === 'daily' && hasPlayedDaily)) return;

        const newMix = { ...currentMix, [channel]: parseInt(value) };
        setCurrentMix(newMix);
    };

    // Handle touch events for better mobile experience
    const handleTouchStart = (e) => {
        e.preventDefault();
    };

    // Check match button - this counts as an attempt
    const handleCheckMatch = () => {
        if (gameWon || attempts >= (gameMode === 'daily' ? 15 : levelSettings[currentLevel]?.maxAttempts) || (gameMode === 'daily' && hasPlayedDaily)) return;

        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        const currentTarget = (targetColors && targetColors[currentColorIndex]) || targetColor;
        if (!currentTarget) return;
        
        const diff = calculateColorDifference(currentMix, currentTarget);
        
        if (diff >= 95) {
            // Check if this is a multi-color level and we need to match more colors
            if (gameMode === 'levels' && targetColors.length > 1) {
                if (currentColorIndex < targetColors.length - 1) {
                    // Move to next color
                    setCurrentColorIndex(currentColorIndex + 1);
                    setCurrentMix({ r: 128, g: 128, b: 128 }); // Reset mix for next color
                    setShowHint(false);
                    return;
                }
            }
            
            // All colors matched or single color matched
            setGameWon(true);
            if (confettiLoaded && window.confetti) {
                window.confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
            playWinSound();
            
            // Unlock next level if in levels mode
            if (gameMode === 'levels' && currentLevel !== null) {
                const nextLevel = currentLevel + 1;
                if (nextLevel < levelSettings.length && !unlockedLevels.includes(nextLevel)) {
                    setUnlockedLevels([...unlockedLevels, nextLevel]);
                    localStorage.setItem('unlockedLevels', JSON.stringify([...unlockedLevels, nextLevel]));
                }
            }
            
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
        setCurrentColorIndex(0);
    };

    const generateNewChallenge = () => {
        if (gameMode === 'daily') {
            const { target, targets } = generateColorChallenge(true);
            if (target && targets) {
                setTargetColor(target);
                setTargetColors(targets);
            }
        } else if (gameMode === 'levels' && currentLevel !== null) {
            const { target, targets } = generateColorChallenge(false, currentLevel);
            if (target && targets) {
                setTargetColor(target);
                setTargetColors(targets);
            }
        }
        // Reset game state for new challenge
        setCurrentMix({ r: 128, g: 128, b: 128 });
        setAttempts(0);
        setGameWon(false);
        setShowHint(false);
        setHintsUsed(0);
        setCurrentColorIndex(0);
    };

    const calculateColorDifference = (color1, color2) => {
        if (!color1 || !color2 || 
            typeof color1.r !== 'number' || typeof color1.g !== 'number' || typeof color1.b !== 'number' ||
            typeof color2.r !== 'number' || typeof color2.g !== 'number' || typeof color2.b !== 'number') {
            return 0;
        }
        
        const diff = Math.sqrt(
            Math.pow(color1.r - color2.r, 2) +
            Math.pow(color1.g - color2.g, 2) +
            Math.pow(color1.b - color2.b, 2)
        );
        return Math.round((1 - diff / 441.67) * 100);
    };

    // Hint system
    const getHintMessage = () => {
        const currentTarget = (targetColors && targetColors[currentColorIndex]) || targetColor;
        if (!currentTarget) return 'No target color available';
        
        const hints = [];
        const threshold = 30;
        
        if (Math.abs(currentTarget.r - currentMix.r) > threshold) {
            hints.push(currentTarget.r > currentMix.r ? '🔴 Need more Red' : '🔴 Less Red needed');
        }
        
        if (Math.abs(currentTarget.g - currentMix.g) > threshold) {
            hints.push(currentTarget.g > currentMix.g ? '🟢 Need more Green' : '🟢 Less Green needed');
        }
        
        if (Math.abs(currentTarget.b - currentMix.b) > threshold) {
            hints.push(currentTarget.b > currentMix.b ? '🔵 Need more Blue' : '🔵 Less Blue needed');
        }

        if (hints.length === 0) {
            return '✨ You\'re very close! Fine-tune your adjustments.';
        }
        
        return hints.join(' | ');
    };

    const getAccuracyHint = () => {
        const currentTarget = (targetColors && targetColors[currentColorIndex]) || targetColor;
        if (!currentTarget) return '🎯 No target available';
        
        const diff = calculateColorDifference(currentMix, currentTarget);
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
        const url = 'https://color-alchemy-game.vercel.app';

        // Copy to clipboard
        navigator.clipboard.writeText(text);
        alert('Results copied to clipboard!');
    };

    const shareToTwitter = () => {
        const emoji = gameWon ? '🎯' : '😅';
        const mode = gameMode === 'daily' ? 'Daily Challenge' : `Level ${currentLevel + 1}`;
        const score = gameWon ? `${attempts} attempts` : `X/${gameMode === 'daily' ? 15 : levelSettings[currentLevel].maxAttempts}`;
        const today = new Date().toISOString().split('T')[0];
        const text = `Color Alchemy ${mode} ${emoji}\nScore: ${score}\nHints: ${hintsUsed}\nDate: ${today}\nPlay at: https://color-alchemy-game.vercel.app`;
        const tweetUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(tweetUrl, '_blank');
    };

    const shareToFacebook = () => {
        const emoji = gameWon ? '🎯' : '😅';
        const mode = gameMode === 'daily' ? 'Daily Challenge' : `Level ${currentLevel + 1}`;
        const score = gameWon ? `${attempts} attempts` : `X/${gameMode === 'daily' ? 15 : levelSettings[currentLevel].maxAttempts}`;
        const text = `Color Alchemy ${mode} ${emoji}\nScore: ${score}\nHints: ${hintsUsed}`;
        const url = 'https://color-alchemy-game.vercel.app';
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        window.open(facebookUrl, '_blank');
    };

    const shareToLinkedIn = () => {
        const emoji = gameWon ? '🎯' : '😅';
        const mode = gameMode === 'daily' ? 'Daily Challenge' : `Level ${currentLevel + 1}`;
        const score = gameWon ? `${attempts} attempts` : `X/${gameMode === 'daily' ? 15 : levelSettings[currentLevel].maxAttempts}`;
        const text = `Color Alchemy ${mode} ${emoji}\nScore: ${score}\nHints: ${hintsUsed}`;
        const url = 'https://color-alchemy-game.vercel.app';
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
        window.open(linkedinUrl, '_blank');
    };

    const shareToWhatsApp = () => {
        const emoji = gameWon ? '🎯' : '😅';
        const mode = gameMode === 'daily' ? 'Daily Challenge' : `Level ${currentLevel + 1}`;
        const score = gameWon ? `${attempts} attempts` : `X/${gameMode === 'daily' ? 15 : levelSettings[currentLevel].maxAttempts}`;
        const text = `Color Alchemy ${mode} ${emoji}\nScore: ${score}\nHints: ${hintsUsed}\nPlay at: https://color-alchemy-game.vercel.app`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    };

    const shareToReddit = () => {
        const emoji = gameWon ? '🎯' : '😅';
        const mode = gameMode === 'daily' ? 'Daily Challenge' : `Level ${currentLevel + 1}`;
        const score = gameWon ? `${attempts} attempts` : `X/${gameMode === 'daily' ? 15 : levelSettings[currentLevel].maxAttempts}`;
        const text = `Color Alchemy ${mode} ${emoji}\nScore: ${score}\nHints: ${hintsUsed}\nPlay at: https://color-alchemy-game.vercel.app`;
        const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent('https://color-alchemy-game.vercel.app')}&title=${encodeURIComponent(text)}`;
        window.open(redditUrl, '_blank');
    };

    const handleLevelSelect = (level) => {
        console.log(`Selecting level ${level + 1} (index ${level})`);
        setCurrentLevel(level);
        setGameMode('levels');
        // Reset game state when switching levels
        setGameWon(false);
        setAttempts(0);
        setShowHint(false);
        setHintsUsed(0);
        setCurrentColorIndex(0);
        setCurrentMix({ r: 128, g: 128, b: 128 });
        
        // Generate new colors for the selected level
        const { target, targets } = generateColorChallenge(false, level);
        console.log('Generated target:', target);
        console.log('Generated targets:', targets);
        if (target && targets) {
            setTargetColor(target);
            setTargetColors(targets);
        }
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

    const currentTarget = (targetColors && targetColors[currentColorIndex]) || targetColor;
    const accuracy = (currentTarget && currentMix) ? calculateColorDifference(currentMix, currentTarget) : 0;
    const maxAttempts = gameMode === 'daily' ? 15 : levelSettings[currentLevel]?.maxAttempts || 15;

    return (
        <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
            <div className="max-w-3xl mx-auto">
                {/* Header with Mode Tabs */}
                <div className="mb-4 sm:mb-6">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 text-center mb-4 sm:mb-6">
                        🎨 Color Alchemy
                    </h1>
                    
                    {/* Mode Tabs */}
                    <div className="flex gap-1 sm:gap-2 bg-white rounded-xl p-1 sm:p-2 shadow-md mb-4">
                        <button
                            onClick={() => {
                                setGameMode('daily');
                                // Reset game state when switching to daily
                                setGameWon(false);
                                setAttempts(0);
                                setShowHint(false);
                                setHintsUsed(0);
                                setCurrentColorIndex(0);
                                setCurrentMix({ r: 128, g: 128, b: 128 });
                                // Generate new daily colors
                                const { target, targets } = generateColorChallenge(true);
                                if (target && targets) {
                                    setTargetColor(target);
                                    setTargetColors(targets);
                                }
                            }}
                            className={`flex-1 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                                gameMode === 'daily' 
                                    ? 'bg-purple-600 text-white shadow-md' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <span className="hidden sm:inline">Daily Challenge</span>
                            <span className="sm:hidden">Daily</span>
                        </button>
                        <button
                            onClick={() => {
                                setGameMode('levels');
                                if (currentLevel === null) setCurrentLevel(0);
                                // Reset game state when switching to levels
                                setGameWon(false);
                                setAttempts(0);
                                setShowHint(false);
                                setHintsUsed(0);
                                setCurrentColorIndex(0);
                                setCurrentMix({ r: 128, g: 128, b: 128 });
                                // Generate new level colors
                                const level = currentLevel === null ? 0 : currentLevel;
                                const { target, targets } = generateColorChallenge(false, level);
                                if (target && targets) {
                                    setTargetColor(target);
                                    setTargetColors(targets);
                                }
                            }}
                            className={`flex-1 px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-bold text-xs sm:text-sm transition-all ${
                                gameMode === 'levels' 
                                    ? 'bg-purple-600 text-white shadow-md' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            Levels
                        </button>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="flex justify-between items-center mb-4 bg-white rounded-xl p-3 sm:p-4 shadow-md">
                    <div>
                        <div className="text-xl sm:text-2xl font-bold text-gray-800">{attempts}/{maxAttempts}</div>
                        <div className="text-xs text-gray-600">Attempts</div>
                    </div>
                    <div className="text-center">
                        <div className="text-base sm:text-lg font-bold text-purple-600">
                            {gameMode === 'daily' ? 'Daily' : `Level ${currentLevel + 1}`}
                        </div>
                        <div className="text-xs text-gray-600">
                            {gameMode === 'levels' && levelSettings[currentLevel]?.name}
                        </div>
                    </div>
                    <button
                        onClick={() => setShowFeedbackModal(true)}
                        className="text-gray-600 hover:bg-gray-100 px-2 sm:px-3 py-2 rounded-lg transition flex items-center gap-1 sm:gap-2"
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-xs font-medium hidden sm:inline">Feedback</span>
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-4">
                    <div className="text-center mb-4 sm:mb-6">
                        <p className="text-gray-600 text-xs sm:text-sm">Adjust RGB sliders to match the target color</p>
                    </div>

                    {/* Multi-color target display */}
                    {targetColors && targetColors.length > 1 && gameMode === 'levels' && (
                        <div className="mb-4">
                            <p className="text-xs font-semibold text-gray-600 mb-2 text-center">
                                Target Colors ({currentColorIndex + 1}/{targetColors.length})
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
                                {targetColors.map((color, index) => (
                                    <div key={index} className="text-center">
                                        <div
                                            className={`w-full h-12 sm:h-16 rounded-lg shadow-lg border-2 transition-all ${
                                                index === currentColorIndex 
                                                    ? 'border-purple-500 ring-2 ring-purple-200' 
                                                    : index < currentColorIndex
                                                        ? 'border-green-500'
                                                        : 'border-gray-200'
                                            }`}
                                            style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
                                        />
                                        <div className="text-xs mt-1 font-mono bg-gray-100 py-1 rounded">
                                            {index < currentColorIndex ? '✓' : index === currentColorIndex ? '→' : '?'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-600 mb-2 text-center">
                                {targetColors && targetColors.length > 1 ? `Target ${currentColorIndex + 1}` : 'Target Color'}
                            </p>
                            <div
                                className="w-full h-24 sm:h-28 rounded-lg shadow-lg border-2 border-gray-200"
                                style={{ backgroundColor: targetColor ? `rgb(${targetColor.r}, ${targetColor.g}, ${targetColor.b})` : 'rgb(255, 255, 255)' }}
                            />
                            <div className="mt-2 text-center text-xs font-mono bg-gray-100 py-1 rounded">
                                RGB(?, ?, ?)
                            </div>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-600 mb-2 text-center">Your Mix</p>
                            <div
                                className={`w-full h-24 sm:h-28 rounded-lg shadow-lg transition-all duration-300 ${
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
                            <div className="space-y-3 sm:space-y-4 mb-4">
                                {/* Red Slider */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="font-semibold text-gray-700 text-sm flex items-center gap-1">
                                            🔴 Red
                                        </label>
                                        <span className="font-mono text-sm bg-red-100 text-red-700 px-2 py-1 rounded-lg min-w-[3rem] text-center">
                                            {currentMix.r}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="255"
                                        value={currentMix.r}
                                        onChange={(e) => handleSliderChange('r', e.target.value)}
                                        onTouchStart={handleTouchStart}
                                        className="w-full h-5 sm:h-4 rounded-lg appearance-none cursor-pointer touch-manipulation slider-thumb"
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
                                        <span className="font-mono text-sm bg-green-100 text-green-700 px-2 py-1 rounded-lg min-w-[3rem] text-center">
                                            {currentMix.g}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="255"
                                        value={currentMix.g}
                                        onChange={(e) => handleSliderChange('g', e.target.value)}
                                        onTouchStart={handleTouchStart}
                                        className="w-full h-5 sm:h-4 rounded-lg appearance-none cursor-pointer touch-manipulation slider-thumb"
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
                                        <span className="font-mono text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-lg min-w-[3rem] text-center">
                                            {currentMix.b}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="255"
                                        value={currentMix.b}
                                        onChange={(e) => handleSliderChange('b', e.target.value)}
                                        onTouchStart={handleTouchStart}
                                        className="w-full h-5 sm:h-4 rounded-lg appearance-none cursor-pointer touch-manipulation slider-thumb"
                                        style={{
                                            background: `linear-gradient(to right, rgb(${currentMix.r},${currentMix.g},0), rgb(${currentMix.r},${currentMix.g},255))`
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                    <button
                                        onClick={() => {
                                            setShowHint('direction');
                                            setHintsUsed(hintsUsed + 1);
                                        }}
                                        className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white font-bold py-3 sm:py-3 rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Lightbulb className="w-4 h-4" />
                                        <span className="hidden sm:inline">Direction Hint</span>
                                        <span className="sm:hidden">Direction</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowHint('accuracy');
                                            setHintsUsed(hintsUsed + 1);
                                        }}
                                        className="bg-gradient-to-r from-purple-400 to-indigo-500 text-white font-bold py-3 sm:py-3 rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Trophy className="w-4 h-4" />
                                        <span className="hidden sm:inline">Accuracy Hint</span>
                                        <span className="sm:hidden">Accuracy</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                    <button
                                        onClick={handleCheckMatch}
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 sm:py-3 rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 text-sm"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                        Check Match
                                    </button>
                                    <button
                                        onClick={resetColorMix}
                                        className="bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold py-3 sm:py-3 rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Trophy className="w-4 h-4" />
                                        Reset
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 gap-2 sm:gap-3">
                                    <button
                                        onClick={generateNewChallenge}
                                        className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 sm:py-3 rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2 text-sm"
                                    >
                                        <Droplet className="w-4 h-4" />
                                        New Challenge
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
                                {gameWon 
                                    ? (gameMode === 'levels' && currentLevel === levelSettings.length - 1) 
                                        ? '🎉 ALL LEVELS COMPLETED! 🎉' 
                                        : 'Perfect Match!'
                                    : 'Out of Attempts!'
                                }
                            </div>
                            <div className="mb-2 text-sm">
                                {gameWon 
                                    ? `You solved it in ${attempts} attempts${targetColors.length > 1 ? ` (${targetColors.length} colors)` : ''}` 
                                    : `You were ${accuracy}% close${targetColors.length > 1 ? ` to color ${currentColorIndex + 1}` : ''}`
                                }
                            </div>
                            <div className="mb-4 text-sm">
                                Hints used: {hintsUsed}
                            </div>
                            {gameMode === 'daily' && hasPlayedDaily && (
                                <p className="text-sm mb-4">Come back tomorrow for a new challenge!</p>
                            )}
                            {gameMode === 'levels' && gameWon && currentLevel === levelSettings.length - 1 && (
                                <p className="text-sm mb-4">🏆 Congratulations! You've mastered all 50 levels! 🏆</p>
                            )}
                            
                            {/* Action buttons for completion screen */}
                            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                                {gameMode === 'levels' && gameWon && currentLevel !== null && currentLevel < levelSettings.length - 1 && (
                                    <button
                                        onClick={() => {
                                            const nextLevel = currentLevel + 1;
                                            handleLevelSelect(nextLevel);
                                        }}
                                        className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold px-6 py-2 rounded-lg hover:shadow-lg transition flex items-center gap-2"
                                    >
                                        <Trophy className="w-4 h-4" />
                                        Next Level ({currentLevel + 2})
                                    </button>
                                )}
                                
                                {(gameMode === 'levels' && (!gameWon || currentLevel === levelSettings.length - 1)) && (
                                    <button
                                        onClick={() => {
                                            if (gameMode === 'levels' && currentLevel !== null) {
                                                // Play again with same level
                                                const { target, targets } = generateColorChallenge(false, currentLevel);
                                                if (target && targets) {
                                                    setTargetColor(target);
                                                    setTargetColors(targets);
                                                }
                                                setCurrentMix({ r: 128, g: 128, b: 128 });
                                                setAttempts(0);
                                                setGameWon(false);
                                                setShowHint(false);
                                                setHintsUsed(0);
                                                setCurrentColorIndex(0);
                                            }
                                        }}
                                        className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold px-6 py-2 rounded-lg hover:shadow-lg transition flex items-center gap-2"
                                    >
                                        <Droplet className="w-4 h-4" />
                                        Play Again
                                    </button>
                                )}
                                
                                <button
                                    onClick={() => setShowShareModal(true)}
                                    className={`bg-white font-bold px-4 py-2 rounded-lg hover:bg-gray-100 transition inline-flex items-center gap-2 ${
                                        gameWon ? 'text-green-600' : 'text-red-600'
                                    }`}
                                >
                                    <Share2 className="w-4 h-4" />
                                    Share Results
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white/80 backdrop-blur rounded-xl p-3 sm:p-4 text-gray-700 shadow-md">
                    <div className="flex items-start gap-2">
                        <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 text-purple-600" />
                        <div className="text-xs sm:text-sm">
                            <p className="font-semibold mb-1 text-gray-800">How to Play:</p>
                            <p className="text-gray-600">Slide the RGB values freely, then click "Check Match" when ready. Use <span className="font-semibold">Direction Hint</span> for color guidance or <span className="font-semibold">Accuracy Hint</span> to see your match percentage!</p>
                        </div>
                    </div>
                </div>

                {/* Level Selection (only visible in levels mode) - Moved after game */}
                {gameMode === 'levels' && (
                    <div className="bg-white rounded-xl p-3 sm:p-4 shadow-md mt-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-800 text-sm">Select Level</h3>
                            <div className="text-xs text-gray-500">
                                {unlockedLevels.length} of {levelSettings.length} unlocked
                            </div>
                        </div>
                        
                        {/* Pagination Controls */}
                        <div className="flex justify-center items-center gap-2 mb-4">
                            <button
                                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                disabled={currentPage === 0}
                                className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                            >
                                ← Prev
                            </button>
                            <span className="text-xs text-gray-600">
                                Page {currentPage + 1} of {Math.ceil(levelSettings.length / levelsPerPage)}
                            </span>
                            <button
                                onClick={() => setCurrentPage(Math.min(Math.ceil(levelSettings.length / levelsPerPage) - 1, currentPage + 1))}
                                disabled={currentPage >= Math.ceil(levelSettings.length / levelsPerPage) - 1}
                                className="px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                            >
                                Next →
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1 sm:gap-2">
                            {levelSettings
                                .slice(currentPage * levelsPerPage, (currentPage + 1) * levelsPerPage)
                                .map((level, index) => {
                                    const actualIndex = currentPage * levelsPerPage + index;
                                    const isUnlocked = unlockedLevels.includes(actualIndex);
                                    const isCurrent = currentLevel === actualIndex;
                                    return (
                                        <button
                                            key={actualIndex}
                                            onClick={() => isUnlocked && handleLevelSelect(actualIndex)}
                                            disabled={!isUnlocked}
                                            className={`p-2 rounded-lg font-bold text-xs transition-all ${
                                                isCurrent 
                                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' 
                                                    : isUnlocked
                                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                            }`}
                                        >
                                            <div className="text-center">
                                                <div className="font-bold text-xs">
                                                    {level.level}
                                                    {level.colorCount > 1 && (
                                                        <span className="text-xs ml-1">({level.colorCount})</span>
                                                    )}
                                                </div>
                                                <div className="text-xs opacity-75 mt-1 hidden sm:block">
                                                    {level.difficulty}
                                                </div>
                                                {!isUnlocked && (
                                                    <div className="text-xs text-red-500 mt-1">🔒</div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                        </div>
                    </div>
                )}

                <div className="flex justify-center gap-4 mt-4">
                </div>

                {showFeedbackModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-4 sm:p-6 max-w-md w-full">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
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

                {/* Share Modal */}
                {showShareModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <Share2 className="w-5 h-5" />
                                Share Your Results
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        shareToTwitter();
                                        setShowShareModal(false);
                                    }}
                                    className="flex items-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                                >
                                    <span className="text-lg">🐦</span>
                                    <span className="text-sm font-medium">Twitter</span>
                                </button>
                                <button
                                    onClick={() => {
                                        shareToFacebook();
                                        setShowShareModal(false);
                                    }}
                                    className="flex items-center gap-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    <span className="text-lg">📘</span>
                                    <span className="text-sm font-medium">Facebook</span>
                                </button>
                                <button
                                    onClick={() => {
                                        shareToLinkedIn();
                                        setShowShareModal(false);
                                    }}
                                    className="flex items-center gap-2 p-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition"
                                >
                                    <span className="text-lg">💼</span>
                                    <span className="text-sm font-medium">LinkedIn</span>
                                </button>
                                <button
                                    onClick={() => {
                                        shareToWhatsApp();
                                        setShowShareModal(false);
                                    }}
                                    className="flex items-center gap-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition"
                                >
                                    <span className="text-lg">📱</span>
                                    <span className="text-sm font-medium">WhatsApp</span>
                                </button>
                                <button
                                    onClick={() => {
                                        shareToReddit();
                                        setShowShareModal(false);
                                    }}
                                    className="flex items-center gap-2 p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                                >
                                    <span className="text-lg">🤖</span>
                                    <span className="text-sm font-medium">Reddit</span>
                                </button>
                                <button
                                    onClick={() => {
                                        shareResults();
                                        setShowShareModal(false);
                                    }}
                                    className="flex items-center gap-2 p-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                                >
                                    <span className="text-lg">📋</span>
                                    <span className="text-sm font-medium">Copy Link</span>
                                </button>
                            </div>
                            <div className="flex justify-end mt-4">
                                <button
                                    onClick={() => setShowShareModal(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Analytics />
        </div>
    );
};

export default ColorAlchemyGame;