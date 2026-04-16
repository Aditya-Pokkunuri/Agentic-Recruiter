import { createContext, useReducer, useEffect, useContext } from 'react';

const ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  OVERRIDE_TWIN: 'OVERRIDE_TWIN'
};

const getInitialState = () => {
  const saved = sessionStorage.getItem('qalana_demo_state');
  return saved ? JSON.parse(saved) : {
    authenticated: false,
    user: null,
    role: null,
    handoff_active: false
  };
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
