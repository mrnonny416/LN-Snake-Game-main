// Sound utilities for the game

let bgmAudio: HTMLAudioElement | null = null;
let countdownAudio: HTMLAudioElement | null = null;
let victoryAudio: HTMLAudioElement | null = null;

/**
 * Play a sound effect
 */
export const playSound = (soundName: "collect" | "victory" | "countdown") => {
  try {
    if (soundName === "countdown") {
      // Store countdown audio for later stopping
      countdownAudio = new Audio(`/sound/${soundName}.mp3`);
      countdownAudio.play().catch(() => {
        // Silently fail if autoplay is blocked
      });
    } else if (soundName === "victory") {
      // Store victory audio for later stopping
      victoryAudio = new Audio(`/sound/${soundName}.mp3`);
      victoryAudio.play().catch(() => {
        // Silently fail if autoplay is blocked
      });
    } else {
      const audio = new Audio(`/sound/${soundName}.mp3`);
      audio.play().catch(() => {
        // Silently fail if autoplay is blocked
      });
    }
  } catch {
    // Silently fail if sound cannot be created
  }
};

/**
 * Stop countdown sound
 */
export const stopCountdownSound = () => {
  if (countdownAudio) {
    countdownAudio.pause();
    countdownAudio.currentTime = 0;
    countdownAudio = null;
  }
};

/**
 * Stop victory sound
 */
export const stopVictorySound = () => {
  if (victoryAudio) {
    victoryAudio.pause();
    victoryAudio.currentTime = 0;
    victoryAudio = null;
  }
};

/**
 * Play BGM (background music) - loops continuously
 */
export const playBGM = async (): Promise<boolean> => {
  try {
    if (!bgmAudio) {
      bgmAudio = new Audio("/sound/bgm.mp3");
      bgmAudio.loop = true;
      bgmAudio.volume = 0.5;
    }
    await bgmAudio.play();
    return true;
  } catch {
    // Autoplay likely blocked or audio could not be created
    return false;
  }
};

/**
 * Stop BGM
 */
export const stopBGM = () => {
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio.currentTime = 0;
  }
};
