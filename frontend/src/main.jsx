import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import TeamForgeLauncher from './TeamForgeLauncher.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TeamForgeLauncher>
      <App />
    </TeamForgeLauncher>
  </StrictMode>,
)