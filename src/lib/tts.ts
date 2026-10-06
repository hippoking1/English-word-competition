class SpeechEngine {
  private voice: SpeechSynthesisVoice | null = null;
  private isLoaded = false;

  constructor() {
    this.initVoices();
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      // Prefer American English natural female voices like Samantha or Google US English
      const usVoices = voices.filter(v => v.lang === 'en-US' || v.lang.startsWith('en_US'));
      this.voice =
        usVoices.find(v => v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Natural')) ||
        usVoices[0] ||
        voices.find(v => v.lang.startsWith('en')) ||
        null;

      this.isLoaded = true;
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  speak(text: string, rate = 0.85) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (!text || text.trim().length === 0) return;

    window.speechSynthesis.cancel(); // Stop prior speech

    const cleanText = text.replace(/[\(\)]/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1.0;

    if (this.voice) {
      utterance.voice = this.voice;
    }

    window.speechSynthesis.speak(utterance);
  }

  stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const tts = new SpeechEngine();
