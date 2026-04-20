/**
 * SpeechService — Real-time speech-to-text using Web Speech API
 * 100% free, built into Chrome/Edge
 * Converts microphone audio to text in real-time
 */

class SpeechService {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.onResult = null;     // callback(text, isFinal)
    this.onError = null;      // callback(error)
    this.onStatusChange = null; // callback(status)
    this._restartTimeout = null;
    this._shouldRestart = false;
  }

  /**
   * Check if the browser supports speech recognition
   */
  static isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Initialize speech recognition
   */
  init(options = {}) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('[SpeechService] Speech Recognition not supported in this browser');
      if (this.onError) this.onError({ type: 'unsupported', message: 'Speech Recognition is not supported. Use Chrome or Edge.' });
      return false;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = options.lang || 'en-US';
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript && this.onResult) {
        this.onResult(finalTranscript.trim(), true);
      } else if (interimTranscript && this.onResult) {
        this.onResult(interimTranscript.trim(), false);
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('[SpeechService] Error:', event.error);
      
      // Don't treat 'no-speech' as a fatal error — just restart
      if (event.error === 'no-speech' || event.error === 'aborted') {
        if (this._shouldRestart) {
          this._scheduleRestart();
        }
        return;
      }

      if (this.onError) {
        this.onError({ type: event.error, message: `Speech recognition error: ${event.error}` });
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onStatusChange) this.onStatusChange('stopped');
      
      // Auto-restart if we should still be listening
      if (this._shouldRestart) {
        this._scheduleRestart();
      }
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStatusChange) this.onStatusChange('listening');
    };

    return true;
  }

  /**
   * Start listening to the microphone
   */
  start() {
    if (!this.recognition) {
      const initialized = this.init();
      if (!initialized) return false;
    }

    this._shouldRestart = true;
    
    try {
      this.recognition.start();
      return true;
    } catch (err) {
      // Already started error — ignore
      if (err.message?.includes('already started')) {
        return true;
      }
      console.error('[SpeechService] Start error:', err);
      return false;
    }
  }

  /**
   * Stop listening
   */
  stop() {
    this._shouldRestart = false;
    if (this._restartTimeout) {
      clearTimeout(this._restartTimeout);
      this._restartTimeout = null;
    }
    
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {
        // Ignore
      }
    }
    this.isListening = false;
  }

  /**
   * Schedule a restart of the recognition (handles Chrome's auto-stop behavior)
   */
  _scheduleRestart() {
    if (this._restartTimeout) {
      clearTimeout(this._restartTimeout);
    }
    this._restartTimeout = setTimeout(() => {
      if (this._shouldRestart && this.recognition) {
        try {
          this.recognition.start();
        } catch (err) {
          // Ignore — might already be running
        }
      }
    }, 300);
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stop();
    if (this.recognition) {
      this.recognition.onresult = null;
      this.recognition.onerror = null;
      this.recognition.onend = null;
      this.recognition.onstart = null;
      this.recognition = null;
    }
    this.onResult = null;
    this.onError = null;
    this.onStatusChange = null;
  }
}

export default SpeechService;
