import React, { useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useCurriculumStore } from '../store/useCurriculumStore';

export const AuthSync: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    useCurriculumStore.getState().setActiveUser(user?.id ?? null);
  }, [user]);

  return null;
};
