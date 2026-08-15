'use client';

import React from 'react';
import { UnifiedClinicalWorkspace } from './UnifiedClinicalWorkspace';
import { Patient, Case, User, ChatMessage } from '@/types';

interface PatientWorkspaceProps {
  patient: Patient;
  cases: Case[];
  currentUser?: User;
  initialActiveCaseId?: string;
  initialTimeline?: any[];
  initialMessages?: ChatMessage[];
  initialChatId?: string | null;
}

export function PatientWorkspace(props: PatientWorkspaceProps) {
  return <UnifiedClinicalWorkspace {...props} />;
}

export { UnifiedClinicalWorkspace };
