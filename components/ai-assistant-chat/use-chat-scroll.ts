'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface UseChatScrollOptions {
  messages: unknown;
  isTyping: boolean;
  loadingHistory: boolean;
}

export function useChatScroll({ messages, isTyping, loadingHistory }: UseChatScrollOptions) {
  const [isNearBottom, setIsNearBottom] = useState(true);
  const messagesScrollerRef = useRef<HTMLDivElement>(null);
  const initialScrollDoneRef = useRef(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const node = messagesScrollerRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
  }, []);

  const resetInitialScroll = useCallback(() => {
    initialScrollDoneRef.current = false;
  }, []);

  useEffect(() => {
    const node = messagesScrollerRef.current;
    if (!node) return undefined;

    const handleScroll = () => {
      const distanceToBottom = node.scrollHeight - node.scrollTop - node.clientHeight;
      setIsNearBottom(distanceToBottom <= 120);
    };

    handleScroll();
    node.addEventListener('scroll', handleScroll);

    return () => {
      node.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (loadingHistory) return;
    if (initialScrollDoneRef.current && !isNearBottom && !isTyping) return;
    const behavior: ScrollBehavior = initialScrollDoneRef.current ? 'smooth' : 'auto';
    const timer = window.requestAnimationFrame(() => {
      scrollToBottom(behavior);
      initialScrollDoneRef.current = true;
    });

    return () => window.cancelAnimationFrame(timer);
  }, [messages, isTyping, loadingHistory, isNearBottom, scrollToBottom]);

  return {
    messagesScrollerRef,
    isNearBottom,
    scrollToBottom,
    resetInitialScroll,
  };
}
