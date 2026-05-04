import { useState, useEffect, useCallback, useRef } from 'react';

export const useCopilot = ({ knowledgeModules = [], masterCases = [] } = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [currentChunk, setCurrentChunk] = useState("");
  const [copilotState, setCopilotState] = useState(null);
  
  const [dgStatus, setDgStatus] = useState("disconnected");
  const [beStatus, setBeStatus] = useState("disconnected");

  const dgWs = useRef(null);
  const beWs = useRef(null);
  const mediaRecorder = useRef(null);
  const audioContext = useRef(null);
  const processor = useRef(null);
  const source = useRef(null);

  const sessionId = useRef(Math.random().toString(36).substring(7)).current;

  // 1. Backend WebSocket Connection
  useEffect(() => {
    // Default to localhost:8000 for Python backend
    let wsUrl = import.meta.env.VITE_BACKEND_WS_URL || `ws://localhost:8000/ws/copilot/${sessionId}`;
    
    // If the URL in .env is a template or hardcoded, we can override the session part
    if (wsUrl.includes('test-session-001')) {
      wsUrl = wsUrl.replace('test-session-001', `session-${sessionId}`);
    }
    
    if (!wsUrl) return;

    const connectBe = () => {
      setBeStatus("connecting");
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setBeStatus("connected");
        console.log("Backend WS: Connected");
        
        const domainContext = `
KNOWLEDGE HUB MODULES:
${knowledgeModules.map(m => `- ${m.name}`).join('\n')}

MASTER CASES:
${masterCases.map(m => `- ${m.title}: ${m.scenario} -> ${m.action}`).join('\n')}
        `.trim();

        ws.send(JSON.stringify({
          type: "session_init",
          expert_name: "Agentic Recruiter Expert",
          expert_domain: domainContext
        }));
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "copilot_update") {
            setCopilotState(payload.data);
          }
        } catch (err) {
          console.error("Backend WS: Failed to parse message", err);
        }
      };

      ws.onclose = () => {
        setBeStatus("disconnected");
        console.log("Backend WS: Disconnected. Reconnecting in 3s...");
        setTimeout(connectBe, 3000);
      };

      beWs.current = ws;
    };

    connectBe();

    return () => {
      beWs.current?.close();
    };
  }, []);

  // 2. Start/Stop Recording & Deepgram Logic
  const startInterview = useCallback(async () => {
    setTranscript("");
    setCurrentChunk("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Initialize Deepgram
      const dgKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
      if (!dgKey) {
        alert("VITE_DEEPGRAM_API_KEY is missing in your .env file.");
        return;
      }

      setDgStatus("connecting");
      
      const dgSocket = new WebSocket("wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language=en-US", [
        "token",
        dgKey,
      ]);

      dgSocket.onopen = () => {
        setDgStatus("connected");
        console.log("Deepgram WS: Connected");
        
        // Start MediaRecorder once socket is open
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0 && dgSocket.readyState === WebSocket.OPEN) {
            dgSocket.send(event.data);
          }
        };
        recorder.start(250); // Send chunks every 250ms
        mediaRecorder.current = recorder;
        setIsRecording(true);
      };

      dgSocket.onmessage = (message) => {
        const received = JSON.parse(message.data);
        const transcriptText = received.channel?.alternatives[0]?.transcript;

        if (transcriptText && received.is_final) {
          setTranscript((prev) => (prev + " " + transcriptText).trim());
          setCurrentChunk(transcriptText);
          
          // Send to Backend
          if (beWs.current?.readyState === WebSocket.OPEN) {
            beWs.current.send(JSON.stringify({
              type: "transcript_chunk",
              chunk: transcriptText
            }));
          }
        }
      };

      dgSocket.onerror = (err) => {
        console.error("Deepgram WS Error:", err);
        setDgStatus("disconnected");
      };

      dgSocket.onclose = () => {
        setDgStatus("disconnected");
        console.log("Deepgram WS: Closed");
      };

      dgWs.current = dgSocket;

    } catch (err) {
      console.error("Failed to start interview", err);
      alert("Error accessing microphone or connecting to Deepgram.");
    }
  }, []);

  const stopInterview = useCallback(() => {
    mediaRecorder.current?.stop();
    dgWs.current?.close();
    setIsRecording(false);
    setDgStatus("disconnected");
  }, []);

  return {
    isRecording,
    transcript,
    copilotState,
    dgStatus,
    beStatus,
    currentChunk,
    startInterview,
    stopInterview
  };
};
