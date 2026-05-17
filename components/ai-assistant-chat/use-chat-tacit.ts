'use client';

import { useState } from 'react';
import {
  cloneTacitKnowledgeInput,
  createEmptyTacitKnowledgeInput,
  type TacitKnowledgeInput,
} from '@/lib/tacit-knowledge';

export function useChatTacit() {
  const [tacitContext, setTacitContext] = useState<TacitKnowledgeInput>(createEmptyTacitKnowledgeInput);
  const [restoredTacitContext, setRestoredTacitContext] = useState<TacitKnowledgeInput>(createEmptyTacitKnowledgeInput);
  const [showTacitComposer, setShowTacitComposer] = useState(false);

  const resetTacit = () => {
    setTacitContext(createEmptyTacitKnowledgeInput());
  };

  const restoreTacit = (source: TacitKnowledgeInput) => {
    setTacitContext(cloneTacitKnowledgeInput(source));
  };

  return {
    tacitContext,
    restoredTacitContext,
    showTacitComposer,
    setTacitContext,
    setRestoredTacitContext,
    setShowTacitComposer,
    resetTacit,
    restoreTacit,
  };
}
