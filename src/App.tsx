import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppShell }      from './components/UI/AppShell';
import { AppRouter }     from './router/AppRouter';
import './styles/globals.css';

const App: React.FC = () => (
  <BrowserRouter>
    <AppShell>
      <AppRouter />
    </AppShell>
  </BrowserRouter>
);

export default App;
