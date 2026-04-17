import { createContext, useReducer, useEffect, useContext } from 'react';

const ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  OVERRIDE_TWIN: 'OVERRIDE_TWIN',
  SAVE_PERSONA: 'SAVE_PERSONA',
  COMPLETE_TRAINING: 'COMPLETE_TRAINING',
  ADD_MASTER_CASE: 'ADD_MASTER_CASE',
  ADD_KNOWLEDGE_MODULE: 'ADD_KNOWLEDGE_MODULE'
};

const getInitialState = () => {
  const saved = sessionStorage.getItem('qalana_demo_state');
  const defaults = {
    authenticated: false,
    user: null,
    role: null,
    handoff_active: false,
    personaAnswers: {},
    personaBlueprint: null,
    isTrained: false,
    masterCases: [
      { id: 'mc1', title: 'Autonomous Hire: Senior Platform Engineer', date: '2026-03-12', scenario: 'Aggressive growth required rapid technical vetting.', action: 'Expert filtering on system design depth.', outcome: 'Confirmed by CEO', efficiency: '+420%' }
    ],
    knowledgeModules: [
      { id: 'm1', name: 'Fullstack Architecture', level: 'Master', docs: 124, icon: 'Globe', status: 'Active' },
      { id: 'm2', name: 'React Internals & Optimization', level: 'Expert', docs: 82, icon: 'Sparkles', status: 'Active' },
      { id: 'm3', name: 'DevOps & K8s Resilience', level: 'Interim', docs: 45, icon: 'Database', status: 'Syncing' },
      { id: 'm4', name: 'Behavioral Psychology', level: 'Master', docs: 210, icon: 'BookOpen', status: 'Active' },
      { id: 'm5', name: 'Data Privacy Laws (GDPR)', level: 'Expert', docs: 15, icon: 'CheckCircle2', status: 'Active' }
    ]
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
      return { ...getInitialState(), authenticated: false, user: null, role: null, handoff_active: false };
    case ACTIONS.OVERRIDE_TWIN:
      return { ...state, handoff_active: true };
    case ACTIONS.SAVE_PERSONA:
      return { ...state, personaAnswers: { ...state.personaAnswers, ...action.payload } };
    case ACTIONS.COMPLETE_TRAINING:
      return { ...state, isTrained: true, personaBlueprint: action.payload };
    case ACTIONS.ADD_MASTER_CASE:
      return { ...state, masterCases: [action.payload, ...state.masterCases] };
    case ACTIONS.ADD_KNOWLEDGE_MODULE:
      return { ...state, knowledgeModules: [action.payload, ...state.knowledgeModules] };
    default:
      return state;
  }
}

export const DemoContext = createContext();

export function DemoProvider({ children }) {
  const [state, dispatch] = useReducer(demoReducer, null, getInitialState);

  useEffect(() => {
    sessionStorage.setItem('qalana_demo_state', JSON.stringify(state));
  }, [state]);

  return (
    <DemoContext.Provider value={{ state, dispatch, ACTIONS }}>
      {children}
    </DemoContext.Provider>
  );
}

export const useDemo = () => useContext(DemoContext);
