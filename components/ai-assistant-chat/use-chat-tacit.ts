'use client';

import { useState } from 'react';
import {
  createEmptyTacitKnowledgeInput,
  type TacitKnowledgeInput,
} from '@/lib/tacit-knowledge';

export function useChatTacit() {
  const [tacitContext, setTacitContext] = useState<TacitKnowledgeInput>(createEmptyTacitKnowledgeInput);
  const [restoredTacitContext, setRestoredTacitContext] = useState<TacitKnowledgeInput>(createEmptyTacitKnowledgeInput);
  const [showTacitComposer, setShowTacitComposer] = useState(false);

  return {
    tacitContext,
    restoredTacitContext,
    showTacitComposer,
    setTacitContext,
    setRestoredTacitContext,
    setShowTacitComposer,
  };
}
