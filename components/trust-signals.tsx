// 信任信号组件 - 入口页核心组件
import { useState } from 'react';
import Link from 'next/link';

export default function TrustSignals() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <TrustSignal 
        icon="✨"
        label="AI命理分析"
        value="大师级解读"
        delay={0}
      />
      <TrustSignal 
        icon="👥"
        label="大师级解读"
        value="10万+案例"
        delay={100}
      />
      <TrustSignal 
        icon="📊"
        value="95%"
        label="准确率"
        delay={200}
      />
    </div>
  );
}

function TrustSignal({ icon, label, value, delay }: any) {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div 
      className="bg-white rounded-lg p-6 shadow-md border-2 border-purple-200 hover:shadow-xl transition transform hover:scale-105 cursor-pointer"
      style={{ 
        animation: `fadeInUp 0.5s ease-out ${delay}ms both`,
        opacity: isVisible ? 1 : 0,
      }}
    >
      <div className="flex items-center justify-center mb-3">
        <span className="text-3xl">{icon}</span>
        <div className="h-px flex-1 bg-purple-200 mx-3"></div>
        <span className="text-sm text-gray-600 font-medium">{label}</span>
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold text-purple-600 mb-1">{value}</div>
      </div>
    </div>
  );
}

// 动画样式
const fadeInUp = `
  @keyframes fadeInUp {
    from {
      opacity: 0,
      transform: translateY(20px);
    }
    to {
      opacity: 1,
      transform: translateY(0);
    }
  }
`;
