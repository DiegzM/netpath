import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider }  from './auth/AuthContext';
import { AuthSync }      from './auth/AuthSync';
import { AppShell }      from './components/UI/AppShell';
import { AppRouter }     from './router/AppRouter';
import './styles/globals.css';

const App: React.FC = () => (
  <AuthProvider>
    <BrowserRouter>
      <AuthSync />
      <AppShell>
        <AppRouter />
      </AppShell>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
