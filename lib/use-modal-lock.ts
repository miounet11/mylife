'use client';

import { useEffect } from 'react';

/**
 * Modal 打开时锁住 body 滚动并支持 ESC 关闭。
 * - 锁 body：overflow:hidden + touch-action:none，避免移动端 overscroll 穿透
 * - ESC 关闭：注册 keydown 监听
 * - 多 modal 叠加安全：用栈计数，最后一个关闭时才解锁
 */

let lockCount = 0;
let savedBodyStyle: { overflow: string; touchAction: string } | null = null;

function applyLock() {
  if (lockCount === 0) {
    savedBodyStyle = {
      overflow: document.body.style.overflow,
      touchAction: document.body.style.touchAction,
    };
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  }
  lockCount += 1;
}

function releaseLock() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0 && savedBodyStyle) {
    document.body.style.overflow = savedBodyStyle.overflow;
    document.body.style.touchAction = savedBodyStyle.touchAction;
    savedBodyStyle = null;
  }
}

export function useModalLockAndEscape(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return;

    applyLock();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      releaseLock();
    };
  }, [isOpen, onClose]);
}
