import { createContext, useReducer, useEffect, useContext } from 'react';

const ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  OVERRIDE_TWIN: 'OVERRIDE_TWIN',
  SAVE_PERSONA: 'SAVE_PERSONA',
  COMPLETE_TRAINING: 'COMPLETE_TRAINING',
  ADD_MASTER_CASE: 'ADD_MASTER_CASE',
  ADD_KNOWLEDGE_MODULE: 'ADD_KNOWLEDGE_MODULE',
  SET_ROOM: 'SET_ROOM',
  PEER_JOINED: 'PEER_JOINED',
  PEER_LEFT: 'PEER_LEFT',
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  ADD_TRANSCRIPT_MESSAGE: 'ADD_TRANSCRIPT_MESSAGE',
  SET_LIVE_TRANSCRIPT: 'SET_LIVE_TRANSCRIPT',
  SAVE_INTERVIEW_TRANSCRIPT: 'SAVE_INTERVIEW_TRANSCRIPT',
  CLEAR_LIVE_TRANSCRIPT: 'CLEAR_LIVE_TRANSCRIPT',
  ADD_ACTIVE_ROOM: 'ADD_ACTIVE_ROOM',
  SET_PERSONA_MANIFEST: 'SET_PERSONA_MANIFEST',
  SET_PERSONA_TRAINING_PHASE: 'SET_PERSONA_TRAINING_PHASE',
  REMOVE_KNOWLEDGE_MODULE: 'REMOVE_KNOWLEDGE_MODULE',
  REMOVE_MASTER_CASE: 'REMOVE_MASTER_CASE',
};

const getInitialState = () => {
  const saved = sessionStorage.getItem('agentic_recruiter_state');
  const defaults = {
    authenticated: false,
    user: null,
    role: null,
    handoff_active: false,
    personaAnswers: {},
    personaBlueprint: null,
    personaManifest: null,
    personaTrainingPhase: 'idle',
    isTrained: false,
    masterCases: [],
    knowledgeModules: [],
    // Real-time interview state
    roomCode: null,
    activeRooms: [], // Array of { code, candidateName }
    peerConnected: false,
    connectionStatus: 'idle', // 'idle' | 'waiting' | 'connecting' | 'connected'
    liveTranscript: [],
    savedTranscripts: [],
  };
  
  if (!saved) return defaults;
  
  // Merge saved state with defaults to ensure new properties exist
  const parsed = JSON.parse(saved);
  return { ...defaults, ...parsed };
};

function demoReducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOGIN:
      return { 
        ...state, 
        authenticated: true, 
        user: { name: action.payload.name },
        role: action.payload.role,
        handoff_active: false
      };
    case ACTIONS.LOGOUT:
      return { ...getInitialState(), authenticated: false, user: null, role: null, handoff_active: false, roomCode: null, peerConnected: false, connectionStatus: 'idle', liveTranscript: [], savedTranscripts: state.savedTranscripts, personaAnswers: state.personaAnswers, personaBlueprint: state.personaBlueprint, personaManifest: state.personaManifest, isTrained: state.isTrained, masterCases: state.masterCases, knowledgeModules: state.knowledgeModules };
    case ACTIONS.OVERRIDE_TWIN:
      return { ...state, handoff_active: true };
    case ACTIONS.SAVE_PERSONA:
      return { ...state, personaAnswers: { ...state.personaAnswers, ...action.payload } };
    case ACTIONS.COMPLETE_TRAINING:
      return { ...state, isTrained: true, personaBlueprint: action.payload };
    case ACTIONS.SET_PERSONA_MANIFEST:
      return { ...state, personaManifest: action.payload, isTrained: true };
    case ACTIONS.SET_PERSONA_TRAINING_PHASE:
      return { ...state, personaTrainingPhase: action.payload };
    case ACTIONS.ADD_MASTER_CASE:
      return { ...state, masterCases: [action.payload, ...state.masterCases] };
    case ACTIONS.REMOVE_MASTER_CASE:
      return { ...state, masterCases: state.masterCases.filter(mc => mc.id !== action.payload) };
    case ACTIONS.ADD_KNOWLEDGE_MODULE:
      return { ...state, knowledgeModules: [action.payload, ...state.knowledgeModules] };
    case ACTIONS.REMOVE_KNOWLEDGE_MODULE:
      return { ...state, knowledgeModules: state.knowledgeModules.filter(km => km.id !== action.payload) };
    
    // Real-time interview actions
    case ACTIONS.SET_ROOM:
      return { ...state, roomCode: action.payload };
    case ACTIONS.PEER_JOINED:
      return { ...state, peerConnected: true, connectionStatus: 'connected' };
    case ACTIONS.PEER_LEFT:
      return { ...state, peerConnected: false, connectionStatus: 'idle' };
    case ACTIONS.SET_CONNECTION_STATUS:
      return { ...state, connectionStatus: action.payload };
    case ACTIONS.ADD_TRANSCRIPT_MESSAGE:
      return { 
        ...state, 
        liveTranscript: [...state.liveTranscript, action.payload]
      };
    case ACTIONS.SET_LIVE_TRANSCRIPT:
      return { ...state, liveTranscript: action.payload };
    case ACTIONS.CLEAR_LIVE_TRANSCRIPT:
      return { ...state, liveTranscript: [] };
    case ACTIONS.SAVE_INTERVIEW_TRANSCRIPT:
      return {
        ...state,
        savedTranscripts: [action.payload, ...state.savedTranscripts]
      };
    case ACTIONS.ADD_ACTIVE_ROOM:
      // Prevent duplicates
      if (state.activeRooms.find(r => r.code === action.payload.code)) return state;
      return {
        ...state,
        activeRooms: [action.payload, ...state.activeRooms]
      };
    default:
      return state;
  }
}

export const DemoContext = createContext();

export function DemoProvider({ children }) {
  const [state, dispatch] = useReducer(demoReducer, null, getInitialState);

  useEffect(() => {
    sessionStorage.setItem('agentic_recruiter_state', JSON.stringify(state));
  }, [state]);

  return (
    <DemoContext.Provider value={{ state, dispatch, ACTIONS }}>
      {children}
    </DemoContext.Provider>
  );
}

export const useDemo = () => useContext(DemoContext);
