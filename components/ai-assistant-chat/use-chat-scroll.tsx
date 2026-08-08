'use client';

import React from 'react';

export function useChatScroll() {
  const [scrollRef, setScrollRef] = React.useState<React.RefObject<HTMLDivElement> | null>(null);

  return { scrollRef, setScrollRef };
}
