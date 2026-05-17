'use client';

import { useState } from 'react';

export function useChatMessageActions() {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [messageActionKey, setMessageActionKey] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [previousUserQuestions, setPreviousUserQuestions] = useState<Record<string, string>>({});

  return {
    editingMessageId,
    editingContent,
    messageActionKey,
    copiedMessageId,
    previousUserQuestions,
    setEditingMessageId,
    setEditingContent,
    setMessageActionKey,
    setCopiedMessageId,
    setPreviousUserQuestions,
  };
}
