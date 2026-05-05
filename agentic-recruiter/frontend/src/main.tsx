import React from 'react'
import ReactDOM from 'react-dom/client'
import { createHashRouter, RouterProvider, Outlet, Navigate } from 'react-router-dom'
import './styles/design-system.css'
import './styles/global.css'
import { DemoProvider, useDemo } from './context/DemoContext'
import { DataProvider } from './context/DataContext'
import Login from './pages/Login/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import AppLayout from './components/Layout/AppLayout'
import LiveInterviews from './pages/LiveInterviews/LiveInterviews'
import CandidateInterview from './pages/CandidateInterview/CandidateInterview'
import Engage from './pages/Engage/Engage'
import Pipeline from './pages/Pipeline/Pipeline'
import Escalation from './pages/Escalation/Escalation'
import Consent from './pages/Consent/Consent'
import Dossier from './pages/Dossier/Dossier'
import DigitalTwin from './pages/DigitalTwin/DigitalTwin'
import KnowledgeHub from './pages/KnowledgeHub/KnowledgeHub'
import Journalist from './pages/Journalist/Journalist'

// A simple auth guard to protect routes
function ProtectedRoute() {
  const { state } = useDemo();
  if (!state.authenticated) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout />;
}

const router = createHashRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <ProtectedRoute />, // Wrap AppLayout with the guard
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'interviews', element: <LiveInterviews /> },
      { path: 'interview', element: <CandidateInterview /> },
      { path: 'engage', element: <Engage /> },
      { path: 'pipeline', element: <Pipeline /> },
      { path: 'escalation', element: <Escalation /> },
      { path: 'consent', element: <Consent /> },
      { path: 'journalist', element: <Journalist /> },
      { path: 'dossier/:id', element: <Dossier /> },
      { path: 'twin', element: <DigitalTwin /> },
      { path: 'knowledge', element: <KnowledgeHub /> }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DemoProvider>
      <DataProvider>
        <RouterProvider router={router} />
      </DataProvider>
    </DemoProvider>
  </React.StrictMode>,
)
