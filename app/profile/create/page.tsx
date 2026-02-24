'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    // 简化流程：如果用户来到创建档案页，直接带他们去填写分析表单，或者直接跳回主档案页
    // 如果之后有完整的创建档案流程可以在这里实现
    router.push('/profile');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-purple-50 flex items-center justify-center">
      <div className="text-center animate-pulse">
        <div className="w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg text-purple-600 font-medium">正在进入您的命理档案...</p>
      </div>
    </div>
  );
}
