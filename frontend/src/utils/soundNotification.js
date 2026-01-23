/**
 * Sound notification utility
 * Plays notification sounds when enabled
 */

// Create audio context for sound effects
let audioContext = null;

/**
 * Initialize the audio context (required for user interaction)
 */
export const initAudioContext = () => {
  if (!audioContext && typeof window !== 'undefined' && window.AudioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (error) {
      console.warn('Audio context not available:', error);
    }
  }
};

/**
 * Play a notification sound using the Web Audio API
 * Creates a pleasant beep sound without requiring an external audio file
 * @param {string} type - Type of notification: 'message', 'request', 'availability', 'success', 'error'
 */
export const playNotificationSound = (type = 'message') => {
  if (!audioContext) {
    initAudioContext();
  }

  if (!audioContext) {
    console.warn('Audio context not available');
    return;
  }

  try {
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set different frequencies and patterns for different notification types
    const soundConfig = {
      message: {
        frequencies: [800, 1000], // Two beeps
        durations: [0.1, 0.1],
        gap: 0.05,
      },
      request: {
        frequencies: [600, 800, 1000], // Three ascending beeps
        durations: [0.1, 0.1, 0.15],
        gap: 0.05,
      },
      availability: {
        frequencies: [900, 700], // Two descending beeps
        durations: [0.12, 0.12],
        gap: 0.04,
      },
      success: {
        frequencies: [1000], // Single high beep
        durations: [0.2],
        gap: 0,
      },
      error: {
        frequencies: [500, 400, 500], // Low warning beeps
        durations: [0.1, 0.1, 0.15],
        gap: 0.05,
      },
    };

    const config = soundConfig[type] || soundConfig.message;

    // Set volume
    gainNode.gain.setValueAtTime(0.3, now);

    // Play the sequence of tones
    let currentTime = now;
    config.frequencies.forEach((freq, index) => {
      const duration = config.durations[index];
      
      oscillator.frequency.setValueAtTime(freq, currentTime);
      gainNode.gain.setValueAtTime(0.3, currentTime);
      gainNode.gain.setValueAtTime(0, currentTime + duration);

      currentTime += duration + config.gap;
    });

    oscillator.start(now);
    oscillator.stop(currentTime);
  } catch (error) {
    console.warn('Error playing notification sound:', error);
  }
};

/**
 * Play a notification sound from a URL (if available)
 * Fallback method using HTML5 Audio
 * @param {string} url - URL to the sound file
 */
export const playNotificationSoundFromUrl = (url) => {
  try {
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play().catch((error) => {
      console.warn('Error playing audio:', error);
    });
  } catch (error) {
    console.warn('Error creating audio element:', error);
  }
};

/**
 * Request user permission to play sounds (required for some browsers)
 */
export const requestAudioPermission = async () => {
  try {
    if (audioContext?.state === 'suspended') {
      await audioContext.resume();
      console.log('Audio context resumed');
    }
  } catch (error) {
    console.warn('Error requesting audio permission:', error);
  }
};
