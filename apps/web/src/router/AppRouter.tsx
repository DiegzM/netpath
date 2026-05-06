import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './PageTransition';
import { ProtectedRoute } from './ProtectedRoute';

import { LandingPage }  from '../pages/LandingPage/LandingPage';
import { LearnPage }    from '../pages/LearnPage/LearnPage';
import { SandboxPage }  from '../pages/SandboxPage/SandboxPage';
import { ProgressPage } from '../pages/ProgressPage/ProgressPage';
import { AuthPage }     from '../pages/AuthPage/AuthPage';
import { SettingsPage } from '../pages/SettingsPage/SettingsPage';

// ─── To add a new page:
//   1. Create src/pages/YourPage/YourPage.tsx
//   2. Import it here
//   3. Add a <Route> wrapped in <PageTransition>
//   4. Add a nav link in AppShell.tsx

export const AppRouter: React.FC = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/"         element={<PageTransition><LandingPage  /></PageTransition>} />
        <Route path="/auth"     element={<PageTransition><AuthPage     /></PageTransition>} />
        <Route path="/sandbox"  element={<PageTransition><SandboxPage  /></PageTransition>} />
        <Route path="/learn"    element={<PageTransition><LearnPage    /></PageTransition>} />
        <Route path="/progress" element={<PageTransition><ProgressPage /></PageTransition>} />
        <Route element={<ProtectedRoute requireUser />}>
          <Route path="/settings" element={<PageTransition><SettingsPage /></PageTransition>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};
