/**
 * 命运类型卡片组件 - 增强版 HERO 展示
 * Life Type Card Component - Enhanced Hero Display
 *
 * 作为首屏核心展示，增强视觉冲击力和情感共鸣
 */
import React, { useState } from 'react';
import { Share2, Copy, Check, Sparkles, TrendingUp, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

// 命运类型定义 - 增强版
const LIFE_TYPES = {
  delayed_reward: {
    label: '延迟兑现型',
    shortLabel: '中年反超',
    quote: '你不是混得差，只是命运的节奏比别人慢半拍',
    description: '前期积累，后期爆发。属于厚积薄发的命格。',
    color: '#8B5CF6',
    lightColor: '#A78BFA',
    emoji: '🌅',
    bgClass: 'from-violet-900/50 via-purple-900/30 to-indigo-900/20',
    borderGlow: 'shadow-violet-500/20',
    advice: '耐心等待拐点，在积累期打好基础',
  },
  early_peak: {
    label: '早熟透支型',
    shortLabel: '少年得志',
    quote: '你的好运来得早，关键是守得住',
    description: '早年机遇多，需要稳住已有成就。',
    color: '#F59E0B',
    lightColor: '#FBBF24',
    emoji: '⭐',
    bgClass: 'from-amber-900/50 via-yellow-900/30 to-orange-900/20',
    borderGlow: 'shadow-amber-500/20',
    advice: '守成比创业更重要，注意守护已有财富',
  },
  high_pressure: {
    label: '高压磨炼型',
    shortLabel: '逆境成长',
    quote: '扛事多，帮人多，但回报慢',
    description: '在压力中成长，磨难出真金。',
    color: '#EF4444',
    lightColor: '#F87171',
    emoji: '🔥',
    bgClass: 'from-red-900/50 via-orange-900/30 to-rose-900/20',
    borderGlow: 'shadow-red-500/20',
    advice: '学会拒绝，保护自己的能量边界',
  },
  noble_dependent: {
    label: '贵人依赖型',
    shortLabel: '贵人运旺',
    quote: '你的命中有贵人，关键是识人用人',
    description: '贵人运强，善于借力成事。',
    color: '#10B981',
    lightColor: '#34D399',
    emoji: '🤝',
    bgClass: 'from-emerald-900/50 via-green-900/30 to-teal-900/20',
    borderGlow: 'shadow-emerald-500/20',
    advice: '珍惜身边贵人，投资人际关系',
  },
  risk_gambler: {
    label: '风险博弈型',
    shortLabel: '冒险家',
    quote: '你不适合稳扎稳打，适合关键时刻押注',
    description: '适合在关键时刻做出重大决策。',
    color: '#F97316',
    lightColor: '#FB923C',
    emoji: '🎲',
    bgClass: 'from-orange-900/50 via-red-900/30 to-amber-900/20',
    borderGlow: 'shadow-orange-500/20',
    advice: '选择适当时机，全力以赴一搏',
  },
  steady_compound: {
    label: '稳态复利型',
    shortLabel: '稳健上升',
    quote: '你的命格适合长期主义，时间是你最好的朋友',
    description: '稳步增长，复利效应明显。',
    color: '#3B82F6',
    lightColor: '#60A5FA',
    emoji: '📈',
    bgClass: 'from-blue-900/50 via-indigo-900/30 to-cyan-900/20',
    borderGlow: 'shadow-blue-500/20',
    advice: '坚持长期投资，定期复盘调整',
  },
};

// 人生阶段配置
const PHASE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  accumulation: { label: '积累蓄势期', color: '#6366F1', icon: '📚' },
  breakthrough: { label: '突破爆发期', color: '#10B981', icon: '🚀' },
  harvest: { label: '收获巅峰期', color: '#F59E0B', icon: '🏆' },
  transition: { label: '转型调整期', color: '#8B5CF6', icon: '🔄' },
  stability: { label: '稳定守成期', color: '#3B82F6', icon: '⚓' },
};

interface LifeTypeData {
  type: string;
  confidence: number;
  currentPhase?: {
    phase: string;
    label: string;
    description: string;
    turningPoint?: number;
  };
  stats?: {
    peakAge?: number;
    peakYear?: number;
    currentScore?: number;
    halfDiff?: number;
  };
}

interface LifeTypeCardProps {
  data: LifeTypeData;
  currentAge?: number;
  className?: string;
  compact?: boolean;
  shareCopies?: Array<{ type: string; text: string }>;
}

export const LifeTypeCard: React.FC<LifeTypeCardProps> = ({
  data,
  currentAge,
  className = '',
  compact = false,
  shareCopies = [],
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const typeInfo = LIFE_TYPES[data.type as keyof typeof LIFE_TYPES] || LIFE_TYPES.steady_compound;
  const phaseInfo = data.currentPhase?.phase
    ? PHASE_CONFIG[data.currentPhase.phase] || { label: data.currentPhase.label, color: typeInfo.color, icon: '📍' }
    : null;

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  if (compact) {
    return (
      <div
        className={`rounded-xl p-4 bg-gradient-to-r ${typeInfo.bgClass} border border-white/20 backdrop-blur-sm ${className}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{typeInfo.emoji}</span>
          <div className="flex-1">
            <div className="text-white font-bold text-lg">{typeInfo.label}</div>
            <div className="text-white/70 text-sm">{typeInfo.shortLabel}</div>
          </div>
          <div
            className="px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ backgroundColor: `${typeInfo.color}40`, color: typeInfo.lightColor }}
          >
            {Math.round(data.confidence * 100)}%
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-2xl overflow-hidden ${typeInfo.borderGlow} shadow-2xl ${className}`}
    >
      {/* Animated Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${typeInfo.bgClass}`} />
      <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl animate-pulse"
           style={{ backgroundColor: `${typeInfo.color}30` }} />
      <div className="absolute -bottom-16 -left-16 w-40 h-40 rounded-full blur-3xl animate-pulse delay-700"
           style={{ backgroundColor: `${typeInfo.color}20` }} />

      {/* Top Glow Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r"
           style={{ background: `linear-gradient(90deg, transparent, ${typeInfo.color}, transparent)` }} />

      <div className="relative z-10 p-6 md:p-8">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-2 text-white/60 text-sm">
            <Sparkles className="w-4 h-4" style={{ color: typeInfo.lightColor }} />
            <span>你的人生类型</span>
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-sm font-bold backdrop-blur-sm"
            style={{ backgroundColor: `${typeInfo.color}30`, color: typeInfo.lightColor, border: `1px solid ${typeInfo.color}50` }}
          >
            置信度 {Math.round(data.confidence * 100)}%
          </div>
        </div>

        {/* Hero Section - Type Display */}
        <div className="flex items-center gap-5 mb-6">
          <div
            className="w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center text-4xl md:text-5xl shadow-lg"
            style={{ backgroundColor: `${typeInfo.color}30`, border: `2px solid ${typeInfo.color}50` }}
          >
            {typeInfo.emoji}
          </div>
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-1 tracking-wide">
              {typeInfo.label}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-white/60">{typeInfo.shortLabel}</span>
              {data.stats?.halfDiff && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: data.stats.halfDiff > 0 ? '#10B98130' : '#EF444430',
                               color: data.stats.halfDiff > 0 ? '#34D399' : '#F87171' }}>
                  <TrendingUp className="w-3 h-3" />
                  {data.stats.halfDiff > 0 ? '后期更强' : '前期更强'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quote - Dramatic Display */}
        <blockquote
          className="relative mb-6 p-5 rounded-xl backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderLeft: `4px solid ${typeInfo.color}` }}
        >
	          <p className="text-xl md:text-2xl text-white/95 font-medium italic leading-relaxed">
	            &ldquo;{typeInfo.quote}&rdquo;
	          </p>
          <p className="mt-3 text-white/60 text-sm">{typeInfo.description}</p>
        </blockquote>

        {/* Turning Point - Visual Emphasis */}
        {data.currentPhase?.turningPoint && (
          <div
            className="flex items-center gap-5 p-5 rounded-xl mb-6"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold" style={{ color: typeInfo.lightColor }}>
                {data.currentPhase.turningPoint}
              </div>
              <div className="text-white/50 text-sm mt-1">岁</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4" style={{ color: typeInfo.lightColor }} />
                <span className="text-white font-bold text-lg">人生拐点</span>
              </div>
	              <p className="text-white/70 text-sm">
	                在此之前是&ldquo;积累命&rdquo;，之后进入&ldquo;收成命&rdquo;阶段
	              </p>
            </div>
          </div>
        )}

        {/* Current Phase Display */}
        {phaseInfo && data.currentPhase && (
          <div
            className="p-5 rounded-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ backgroundColor: phaseInfo.color }}
              />
              <span className="text-white/60 text-sm">
                {currentAge ? `${currentAge}岁的你` : '你现在'}处于
              </span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{phaseInfo.icon}</span>
              <h3 className="text-2xl font-bold text-white">{phaseInfo.label}</h3>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">{data.currentPhase.description}</p>

            {/* Advice */}
            <div
              className="mt-4 pt-4 border-t border-white/10"
            >
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/50">💡 建议:</span>
                <span className="text-white/80">{typeInfo.advice}</span>
              </div>
            </div>
          </div>
        )}

        {/* Share Copies - Expandable */}
        {shareCopies.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-2 text-white/60 hover:text-white/80 text-sm transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>分享文案</span>
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expanded && (
              <div className="mt-4 space-y-3 animate-fade-in">
                {shareCopies.map((copy, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                  >
                    <p className="flex-1 text-white/80 text-sm whitespace-pre-line">{copy.text}</p>
                    <button
                      onClick={() => handleCopy(copy.text, copy.type)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                      title="复制"
                    >
                      {copied === copy.type ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/60" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LifeTypeCard;
