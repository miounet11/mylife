'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, RefObject } from 'react';
import {
  ArrowDown,
  ArrowRight,
  Bot,
  CalendarClock,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  FileText,
  GraduationCap,
  Hand,
  Image as ImageIcon,
  ImagePlus,
  Paperclip,
  Pencil,
  PenLine,
  Plus,
  RotateCcw,
  ScanFace,
  ScrollText,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  buildChatEventDraft,
  type ChatContextEvent,
  type ChatCorrectionPrompt,
  type ChatExperienceContext,
  type ChatReportContext,
} from '@/lib/chat-context';
import { getChatIntentPreset, listChatIntentPresets } from '@/lib/chat-intent';
import { trackClientEvent } from '@/lib/analytics-client';
import { trackGoogleAnalyticsEvent } from '@/lib/google-analytics';
import ChatMarkdown from '@/components/chat-markdown';
import TacitKnowledgeComposer from '@/components/tacit-knowledge-composer';
import type { ReportActionSuggestion } from '@/lib/report-v2';
import {
  areTacitKnowledgeInputsEqual,
  buildTacitKnowledgeSummary,
  cloneTacitKnowledgeInput,
  createEmptyTacitKnowledgeInput,
  hasTacitKnowledgeInput,
  type TacitKnowledgeInput,
} from '@/lib/tacit-knowledge';
import { buildChatHref } from '@/lib/chat-entry';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | null;
  llmUsed?: boolean;
  edited?: boolean;
  regenerated?: boolean;
  reportId?: string | null;
  eventId?: string | null;
  responseToQuestionId?: string | null;
  tacitContext?: TacitKnowledgeInput | null;
  tacitSummary?: string | null;
  materials?: ChatMaterialDisplay[];
  materialSummary?: string | null;
}

type ChatMaterialKind = 'floor_plan' | 'face_photo' | 'palm_photo' | 'handwriting' | 'study_material' | 'scene_photo' | 'legal_document' | 'other_document';

type ChatMaterialDisplay = {
  id: string;
  kind: ChatMaterialKind;
  label: string;
  note?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  hasImage?: boolean;
  previewUrl?: string;
  imageIncluded?: boolean;
};

type ChatMaterialDraft = ChatMaterialDisplay & {
  dataUrl?: string;
};

type ChatContextReport = ChatReportContext;
type SuggestedEventDraft = ReportActionSuggestion;

type ChatContextState = ChatExperienceContext;

interface QuickQuestionButtonProps {
  question: string;
  onClick: () => void;
  disabled?: boolean;
}

const defaultWorldYiQuestions = [
  '结合我的命局结构和当前阶段，现在最该先推进哪一件事？',
  '如果把这件事放到接下来三个月看，我更该推进、观察还是收手？',
  '这段关系现在的问题更像结构不合、阶段不对，还是环境压力过大？',
  '我现在最需要规避的误判是什么，为什么？',
];

const materialKindOptions: Array<{
  kind: ChatMaterialKind;
  label: string;
  icon: LucideIcon;
  accept: string;
  placeholder: string;
}> = [
  {
    kind: 'floor_plan',
    label: '户型图',
    icon: Compass,
    accept: 'image/*',
    placeholder: '方向/城市/居住人数/困扰点，例如睡眠、潮湿、动线乱',
  },
  {
    kind: 'face_photo',
    label: '面相',
    icon: ScanFace,
    accept: 'image/*',
    placeholder: '正面/侧面、近期状态、想重点看哪件事',
  },
  {
    kind: 'palm_photo',
    label: '手相',
    icon: Hand,
    accept: 'image/*',
    placeholder: '左/右手、掌纹清晰度、当前问题',
  },
  {
    kind: 'handwriting',
    label: '字迹',
    icon: PenLine,
    accept: 'image/*',
    placeholder: '手写内容、书写场景、想观察的性格/状态',
  },
  {
    kind: 'study_material',
    label: '学习材料',
    icon: GraduationCap,
    accept: 'image/*,.pdf,.txt',
    placeholder: '课程/成绩/学习计划摘要，最卡的点',
  },
  {
    kind: 'scene_photo',
    label: '场景照片',
    icon: ImageIcon,
    accept: 'image/*',
    placeholder: '照片场景、时间、相关人物关系',
  },
  {
    kind: 'legal_document',
    label: '法院/合同',
    icon: ScrollText,
    accept: 'image/*,.pdf,.txt',
    placeholder: '文书类型、争议点、关键条款；先打码',
  },
  {
    kind: 'other_document',
    label: '其他资料',
    icon: FileText,
    accept: 'image/*,.pdf,.txt',
    placeholder: '资料来源、关键内容、希望判断的问题',
  },
];

const maxMaterialCount = 4;
const maxInlineImageBytes = 1.8 * 1024 * 1024;

function getMaterialOption(kind: ChatMaterialKind) {
  return materialKindOptions.find((item) => item.kind === kind) || materialKindOptions[materialKindOptions.length - 1];
}

function formatFileSize(size?: number) {
  if (!size || size <= 0) return '';
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))}KB`;
  }
  return `${(size / 1024 / 1024).toFixed(1)}MB`;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error || new Error('读取文件失败'));
    reader.readAsDataURL(file);
  });
}

function toMaterialPayload(materials: ChatMaterialDraft[]) {
  return materials.map((item) => ({
    id: item.id,
    kind: item.kind,
    label: item.label,
    note: item.note || '',
    fileName: item.fileName || '',
    mimeType: item.mimeType || '',
    size: item.size || 0,
    dataUrl: item.dataUrl || '',
  }));
}

function formatChatTime(value: Date | null) {
  if (!value || Number.isNaN(value.getTime())) {
    return '--:--';
  }

  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

function buildScopedChatHref(params: {
  reportId?: string;
  eventId?: string;
  intent?: string;
  source?: string;
  ctaStrategyKey?: string;
  sourceFamily?: string;
}) {
  return buildChatHref(params);
}

export default function AIAssistantChat() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get('reportId') || '';
  const eventId = searchParams.get('eventId') || '';
  const intent = searchParams.get('intent') || '';
  const source = searchParams.get('source') || '';
  const ctaStrategyKey = searchParams.get('ctaStrategyKey') || '';
  const sourceFamily = searchParams.get('sourceFamily') || '';
  const prefilledQuestion = searchParams.get('question') || '';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [context, setContext] = useState<ChatContextState | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [savingEventKey, setSavingEventKey] = useState<string | null>(null);
  const [savedEventKeys, setSavedEventKeys] = useState<string[]>([]);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [messageActionKey, setMessageActionKey] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [previousUserQuestions, setPreviousUserQuestions] = useState<Record<string, string>>({});
  const [tacitContext, setTacitContext] = useState<TacitKnowledgeInput>(createEmptyTacitKnowledgeInput);
  const [restoredTacitContext, setRestoredTacitContext] = useState<TacitKnowledgeInput>(createEmptyTacitKnowledgeInput);
  const [showTacitComposer, setShowTacitComposer] = useState(false);
  const [materials, setMaterials] = useState<ChatMaterialDraft[]>([]);
  const [selectedMaterialKind, setSelectedMaterialKind] = useState<ChatMaterialKind>('face_photo');
  const [materialNote, setMaterialNote] = useState('');
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [materialError, setMaterialError] = useState('');
  const messagesScrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const materialFileInputRef = useRef<HTMLInputElement>(null);
  const initialScrollDoneRef = useRef(false);
  const fetchHistoryRef = useRef<(showLoader?: boolean) => Promise<boolean>>(async () => false);
  const intentPreset = getIntentPreset(intent);
  const scopedIntentLinks = listChatIntentPresets().map((item) => ({
    ...item,
    href: buildScopedChatHref({
      reportId: reportId || context?.report?.id || undefined,
      eventId: eventId || context?.focusedEvent?.id || undefined,
      intent: item.key,
      source: source || undefined,
      ctaStrategyKey: ctaStrategyKey || undefined,
      sourceFamily: sourceFamily || undefined,
    }),
  }));
  const scopePayload = {
    reportId: reportId || context?.report?.id || undefined,
    eventId: eventId || context?.focusedEvent?.id || undefined,
    intent: intent || undefined,
    source: source || undefined,
    ctaStrategyKey: ctaStrategyKey || undefined,
    sourceFamily: sourceFamily || undefined,
  };
  const isPalmistryUploadFlow = intent === 'palmistry-reading';
  const tacitSummary = buildTacitKnowledgeSummary(tacitContext);
  const hasTacitContext = hasTacitKnowledgeInput(tacitContext);
  const canRestoreTacit = hasTacitKnowledgeInput(restoredTacitContext) && !areTacitKnowledgeInputsEqual(restoredTacitContext, tacitContext);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const node = messagesScrollerRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior });
  };

  const fetchHistory = async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoadingHistory(true);
      }
      setError('');
      const queryParams = new URLSearchParams();
      if (reportId) queryParams.set('reportId', reportId);
      if (eventId) queryParams.set('eventId', eventId);
      if (intent) queryParams.set('intent', intent);
      if (source) queryParams.set('source', source);
      if (ctaStrategyKey) queryParams.set('ctaStrategyKey', ctaStrategyKey);
      if (sourceFamily) queryParams.set('sourceFamily', sourceFamily);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await fetch(`/api/chat${query}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '加载聊天历史失败');
        return false;
      }

      const mapped = (data.history || []).map((item: any) => ({
        id: item.id,
        role: item.role,
        content: item.content || '',
        timestamp: item.timestamp ? new Date(item.timestamp) : null,
        llmUsed: item.role === 'assistant' ? !!item.llmUsed : undefined,
        edited: !!item.edited,
        regenerated: !!item.regenerated,
        reportId: item.reportId || null,
        eventId: item.eventId || null,
        responseToQuestionId: item.responseToQuestionId || null,
        tacitContext: item.tacitContext || null,
        tacitSummary: item.tacitSummary || null,
        materials: Array.isArray(item.materials) ? item.materials : [],
        materialSummary: item.materialSummary || null,
      }));
      const latestTacitContext = findLatestScopedTacitContext(mapped);

      setMessages(mapped);
      setPreviousUserQuestions(buildPreviousUserQuestionMap(mapped));
      setContext(data.context || null);
      setRestoredTacitContext(latestTacitContext);
      setTacitContext(cloneTacitKnowledgeInput(latestTacitContext));
      setShowTacitComposer(hasTacitKnowledgeInput(latestTacitContext));
      return true;
    } catch {
      setError('网络异常，加载聊天历史失败');
      return false;
    } finally {
      if (showLoader) {
        setLoadingHistory(false);
      }
    }
  };

  fetchHistoryRef.current = fetchHistory;

  useEffect(() => {
    initialScrollDoneRef.current = false;
    void fetchHistoryRef.current(true);
  }, [reportId, eventId, intent, source, ctaStrategyKey, sourceFamily]);

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
  }, [messages, isTyping, loadingHistory, isNearBottom]);

  useEffect(() => {
    const node = inputRef.current;
    if (!node) return;
    node.style.height = '0px';
    node.style.height = `${Math.min(node.scrollHeight, 200)}px`;
  }, [input]);

  useEffect(() => {
    const intendedMaterialKind: ChatMaterialKind | null = intent === 'home-layout-diagnosis'
      ? 'floor_plan'
      : intent === 'palmistry-reading'
        ? 'palm_photo'
        : null;
    if (intendedMaterialKind && selectedMaterialKind !== intendedMaterialKind) {
      setSelectedMaterialKind(intendedMaterialKind);
      setMaterialError('');
    }
  }, [intent, selectedMaterialKind]);

  useEffect(() => {
    if (prefilledQuestion && !input.trim() && messages.length === 0) {
      setInput(prefilledQuestion);
      return;
    }

    if (!intentPreset || input.trim() || messages.length > 0 || prefilledQuestion) {
      return;
    }

    setInput(intentPreset.prefillQuestion);
  }, [intentPreset, input, messages.length, prefilledQuestion]);

  useEffect(() => {
    if (!copiedMessageId) return undefined;
    const timer = window.setTimeout(() => setCopiedMessageId(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copiedMessageId]);

  const trackFollowupClick = (question: string) => {
    void fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'chat_followup_clicked',
        page: '/chat',
        meta: {
          question,
          reportId: context?.report?.id || reportId || null,
          eventId: context?.focusedEvent?.id || eventId || null,
          intent: intent || null,
          source: source || null,
          ctaStrategyKey: ctaStrategyKey || null,
          sourceFamily: sourceFamily || null,
        },
      }),
    }).catch(() => undefined);
  };

  const saveEventPayload = async (eventKey: string, payload: Record<string, unknown>) => {
    if (savingEventKey) return;
    setSavingEventKey(eventKey);
    setError('');

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '保存事件失败');
        return;
      }
      setSavedEventKeys((current) => (current.includes(eventKey) ? current : [...current, eventKey]));
    } catch {
      setError('网络异常，保存事件失败');
    } finally {
      setSavingEventKey(null);
    }
  };

  const handleMaterialFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (materials.length >= maxMaterialCount) {
      setMaterialError(`最多保留 ${maxMaterialCount} 份资料`);
      return;
    }

    const option = getMaterialOption(selectedMaterialKind);
    const isImage = file.type.startsWith('image/');
    setIsAddingMaterial(true);
    setMaterialError('');

    try {
      const dataUrl = isImage && file.size <= maxInlineImageBytes
        ? await readFileAsDataUrl(file)
        : '';
      const note = materialNote.trim();
      const material: ChatMaterialDraft = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        kind: option.kind,
        label: option.label,
        note,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        hasImage: isImage,
        previewUrl: dataUrl || undefined,
        imageIncluded: Boolean(dataUrl),
        dataUrl,
      };

      setMaterials((current) => [...current, material]);
      if (isPalmistryUploadFlow && material.kind === 'palm_photo') {
        void trackClientEvent({
          eventName: 'tool_image_upload_material_added',
          page: '/chat',
          meta: {
            toolSlug: 'application-palmistry-reading',
            intent,
            source: source || null,
            ctaStrategyKey: ctaStrategyKey || null,
            sourceFamily: sourceFamily || null,
            materialKind: material.kind,
            imageIncluded: material.imageIncluded,
            fileSize: material.size,
            mimeType: material.mimeType,
          },
        });
      }
      setMaterialNote('');
      if (isImage && !dataUrl) {
        setMaterialError('图片过大，已保留资料标签和备注；可补充关键内容。');
      }
      if (!isImage && !note) {
        setMaterialError('文书和材料不会直接上传原文，请补充关键摘要。');
      }
    } catch {
      setMaterialError('资料读取失败，请换一张图片或补充文字摘要。');
    } finally {
      setIsAddingMaterial(false);
    }
  };

  const handleAddTextMaterial = () => {
    const note = materialNote.trim();
    if (!note) {
      setMaterialError('先写一句资料摘要');
      return;
    }
    if (materials.length >= maxMaterialCount) {
      setMaterialError(`最多保留 ${maxMaterialCount} 份资料`);
      return;
    }

    const option = getMaterialOption(selectedMaterialKind);
    setMaterials((current) => [
      ...current,
      {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        kind: option.kind,
        label: option.label,
        note,
      },
    ]);
    setMaterialNote('');
    setMaterialError('');
  };

  const handleRemoveMaterial = (materialId: string) => {
    setMaterials((current) => current.filter((item) => item.id !== materialId));
  };

  const sendQuestion = async (rawQuestion: string) => {
    if (isTyping || loadingHistory) return;
    const question = rawQuestion.trim();
    if (!question) return;
    const materialSnapshot = materials;

    const userMessage: ChatMessage = {
      id: `${Date.now()}_user`,
      role: 'user',
      content: question,
      timestamp: null,
      tacitContext: hasTacitContext ? cloneTacitKnowledgeInput(tacitContext) : null,
      tacitSummary: tacitSummary || null,
      materials: materialSnapshot.map(({ dataUrl, ...item }) => item),
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setMaterials([]);
    setMaterialNote('');
    setMaterialError('');
    setIsTyping(true);
    setError('');
    setEditingMessageId(null);
    setRestoredTacitContext(cloneTacitKnowledgeInput(tacitContext));
    const palmPhotoCount = materialSnapshot.filter((item) => item.kind === 'palm_photo').length;
    if (isPalmistryUploadFlow && palmPhotoCount > 0) {
      void trackClientEvent({
        eventName: 'tool_image_upload_started',
        page: '/chat',
        meta: {
          phase: 'client_intent',
          confirmed: false,
          toolSlug: 'application-palmistry-reading',
          intent,
          source: source || null,
          ctaStrategyKey: ctaStrategyKey || null,
          sourceFamily: sourceFamily || null,
          materialCount: materialSnapshot.length,
          palmPhotoCount,
          imageMaterialCount: materialSnapshot.filter((item) => item.imageIncluded).length,
        },
      });
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          tacitContext,
          materials: toMaterialPayload(materialSnapshot),
          ...scopePayload,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setMessages((current) => current.filter((item) => item.id !== userMessage.id));
        setMaterials(materialSnapshot);
        setError(data.error || 'AI 回复失败，请稍后重试');
        return;
      }

      await fetchHistory(false);

      trackGoogleAnalyticsEvent('chat_completed', {
        report_id: reportId || context?.report?.id || '',
        event_id: eventId || context?.focusedEvent?.id || '',
        intent: intent || 'default',
        llm_used: !!data.llmUsed,
        material_count: materialSnapshot.length,
      });

      if (!data.llmUsed) {
        setError('当前为简化回答版本，你可以稍后重试，或把问题问得更具体一些。');
      }
    } catch {
      setMessages((current) => current.filter((item) => item.id !== userMessage.id));
      setMaterials(materialSnapshot);
      setError('网络异常，AI 回复失败');
    } finally {
      setIsTyping(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (isTyping || loadingHistory) return;
    if (!window.confirm('删除这条消息后，这条消息之后的对话也会一并移除，确认继续吗？')) {
      return;
    }
    setMessageActionKey(`delete:${messageId}`);
    setError('');
    setEditingMessageId(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          ...scopePayload,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '删除消息失败');
        return;
      }
      await fetchHistory(false);
    } catch {
      setError('网络异常，删除消息失败');
    } finally {
      setMessageActionKey(null);
    }
  };

  const handleRegenerateMessage = async (messageId: string) => {
    if (isTyping || loadingHistory) return;
    if (!window.confirm('重新生成会覆盖这条回答之后的对话分支，确认继续吗？')) {
      return;
    }
    setMessageActionKey(`regenerate:${messageId}`);
    setIsTyping(true);
    setError('');
    setEditingMessageId(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'regenerate',
          messageId,
          ...scopePayload,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '重新生成失败');
        return;
      }
      await fetchHistory(false);
      if (!data.llmUsed) {
        setError('当前为简化回答版本，你可以稍后再试。');
      }
    } catch {
      setError('网络异常，重新生成失败');
    } finally {
      setIsTyping(false);
      setMessageActionKey(null);
    }
  };

  const handleStartEdit = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  const handleSubmitEdit = async (messageId: string) => {
    if (isTyping || loadingHistory) return;
    const content = editingContent.trim();
    if (!content) {
      setError('问题内容不能为空');
      return;
    }

    if (!window.confirm('重新提交后，这条问题之后的回答会按新问题重算，后续对话分支也会被替换，确认继续吗？')) {
      return;
    }

    setMessageActionKey(`edit:${messageId}`);
    setIsTyping(true);
    setError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          messageId,
          content,
          ...scopePayload,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || '修改消息失败');
        return;
      }
      setEditingMessageId(null);
      setEditingContent('');
      await fetchHistory(false);
      if (!data.llmUsed) {
        setError('当前为简化回答版本，你可以稍后再试。');
      }
    } catch {
      setError('网络异常，修改消息失败');
    } finally {
      setIsTyping(false);
      setMessageActionKey(null);
    }
  };

  const handlePromptClick = (question: string) => {
    trackFollowupClick(question);
    void sendQuestion(question);
  };

  const handleSaveSuggestedEvent = (item: SuggestedEventDraft) => {
    void saveEventPayload(`suggestion:${item.key}`, {
      type: item.type,
      title: item.title,
      date: item.date,
      description: item.description,
      impact: item.impact,
      reminderEnabled: true,
      reminderAdvanceDays: item.reminderAdvanceDays,
      reminderMethod: 'app',
      source: 'chat_message',
      page: '/chat',
      attributionSource: source || undefined,
      fortuneAnalysis: {
        source: 'chat_message',
        reportId: context?.report?.id || reportId || undefined,
        attributionSource: source || undefined,
        suggestionKey: item.key,
        reason: item.reason,
        title: item.title,
      },
      followUpAdvice: {
        shortTerm: item.reason,
        longTerm: '事件发生后回到聊天页继续复盘，校验这次判断与现实偏差。',
      },
    });
  };

  const handleSaveMessageEvent = (question: string, answer: string, key: string) => {
    const draft = buildChatEventDraft({
      question,
      answer,
      context,
    });

    void saveEventPayload(`message:${key}`, {
      ...draft,
      reminderEnabled: true,
      reminderMethod: 'app',
      source: 'chat_message',
      page: '/chat',
      attributionSource: source || undefined,
    });
  };

  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
    } catch {
      setError('复制失败，请稍后再试');
    }
  };

  const quickQuestions = context?.suggestedPrompts?.length
    ? context.suggestedPrompts
    : defaultWorldYiQuestions;
  const visibleQuickQuestions = intentPreset
    ? Array.from(new Set([...intentPreset.questions, ...quickQuestions])).slice(0, 4)
    : quickQuestions;

  return (
    <div className="flex h-full flex-col bg-transparent">
      <div className="border-b border-white/60 bg-white/70 p-4 md:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-[color:var(--ink)]">世界易结构追问器</h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {reportId || context?.report?.id ? (
              <span className="rounded-md bg-[color:var(--bg-sunken)] px-2.5 py-1 text-xs font-semibold text-[color:var(--muted)]">
                已绑定报告
              </span>
            ) : null}
            {eventId || context?.focusedEvent?.id ? (
              <span className="rounded-md bg-[color:var(--bg-sunken)] px-2.5 py-1 text-xs font-semibold text-[color:var(--muted)]">
                已绑定事件
              </span>
            ) : null}
            <span className="rounded-md bg-[color:var(--bg-sunken)] px-2.5 py-1 text-xs font-semibold text-[color:var(--muted)]">
              {intentPreset ? `专项 ${intentPreset.entryLabel}` : '自由结构追问'}
            </span>
          </div>
        </div>

        <details className="mt-3 rounded-lg border border-[color:var(--line)] bg-white/74">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-[color:var(--muted)]">
            切换专项
            <span className="text-[color:var(--accent-strong)]">{intentPreset?.entryLabel || '自由结构追问'}</span>
          </summary>
          <div className="grid gap-2 border-t border-[color:var(--line)] p-3 sm:grid-cols-2">
            {scopedIntentLinks.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm transition hover:-translate-y-0.5 ${
                  item.key === intent ? 'bg-[color:var(--accent-soft)] font-semibold text-[color:var(--accent-strong)]' : 'bg-[color:var(--bg-elevated)] text-[color:var(--ink)]'
                }`}
              >
                <div>{item.entryLabel}</div>
              </Link>
            ))}
          </div>
        </details>
      </div>

      <div className="relative flex-1">
        <div ref={messagesScrollerRef} className="flex h-full flex-col space-y-3 overflow-y-auto p-4 md:p-5">
          {context && (
            <ContextCard
              context={context}
              intentPreset={intentPreset}
              onPromptClick={handlePromptClick}
              onSaveSuggestedEvent={handleSaveSuggestedEvent}
              disabled={isTyping || loadingHistory}
              savingEventKey={savingEventKey}
              savedEventKeys={savedEventKeys}
            />
          )}

          {error && (
            <div className="rounded-[var(--radius)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)] px-4 py-3 text-sm text-[color:var(--signal-strong)]">
              {error}
            </div>
          )}

          {loadingHistory && <div className="py-10 text-center text-sm text-[color:var(--muted)]">正在载入聊天记录...</div>}

          {!loadingHistory && messages.length === 0 && !context && (
            <div className="space-y-4 rounded-[var(--radius)] bg-white/75 p-4 md:p-5">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
                  <Sparkles className="h-3 w-3" />
                  推荐追问
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-2">
                {visibleQuickQuestions.slice(0, 2).map((question) => (
                  <QuickQuestionButton
                    key={question}
                    question={question}
                    onClick={() => handlePromptClick(question)}
                    disabled={isTyping || loadingHistory}
                  />
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              previousUserQuestion={previousUserQuestions[message.id] || ''}
              onSaveEvent={handleSaveMessageEvent}
              onDelete={handleDeleteMessage}
              onRegenerate={handleRegenerateMessage}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
              onSubmitEdit={handleSubmitEdit}
              isEditing={editingMessageId === message.id}
              editingContent={editingContent}
              onEditingContentChange={setEditingContent}
              isSaving={savingEventKey === `message:${message.id}`}
              isSaved={savedEventKeys.includes(`message:${message.id}`)}
              isActing={messageActionKey === `delete:${message.id}` || messageActionKey === `regenerate:${message.id}` || messageActionKey === `edit:${message.id}`}
              onCopy={handleCopyMessage}
              copied={copiedMessageId === message.id}
            />
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-[var(--radius-md)] bg-white px-4 py-3 text-sm text-[color:var(--muted)]">正在整理回答，请稍候...</div>
            </div>
          )}
        </div>

        {!isNearBottom && messages.length > 0 ? (
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            className="absolute bottom-4 right-4 inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] shadow-[var(--shadow-card)] transition hover:border-[color:var(--brand)]"
          >
            <ArrowDown className="h-4 w-4" />
            回到最新消息
          </button>
        ) : null}
      </div>

      <div className="border-t border-white/60 bg-white/70 p-4 md:p-5">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendQuestion(input);
          }}
          className="space-y-3"
        >
          <MaterialEvidenceComposer
            materials={materials}
            selectedKind={selectedMaterialKind}
            note={materialNote}
            isAdding={isAddingMaterial}
            error={materialError}
            disabled={isTyping || loadingHistory}
            fileInputRef={materialFileInputRef}
            onKindChange={(kind) => {
              setSelectedMaterialKind(kind);
              setMaterialError('');
            }}
            onNoteChange={setMaterialNote}
            onFileChange={handleMaterialFileChange}
            onUploadClick={() => materialFileInputRef.current?.click()}
            onAddText={handleAddTextMaterial}
            onRemove={handleRemoveMaterial}
          />

          <TacitKnowledgeComposer
            value={tacitContext}
            onChange={setTacitContext}
            title="说不清也可以先点出来"
            description=""
            collapsedLabel="补充这一轮状态"
            emptyHint=""
            summaryLabel="本轮默会信息："
            expanded={showTacitComposer}
            onExpandedChange={setShowTacitComposer}
            onReset={() => setTacitContext(createEmptyTacitKnowledgeInput())}
            variant="chat"
            restoreLabel="沿用上一轮状态"
            onRestore={() => {
              setTacitContext(cloneTacitKnowledgeInput(restoredTacitContext));
              setShowTacitComposer(hasTacitKnowledgeInput(restoredTacitContext));
            }}
            canRestore={canRestoreTacit}
          />

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    if (input.trim() && !isTyping && !isAddingMaterial) {
                      void sendQuestion(input);
                    }
                  }
                }}
                placeholder={intentPreset?.placeholder || '输入你最关心的一个问题，例如“结合 2026.08 这个窗口，我该不该推进跳槽？”'}
                rows={2}
                className="min-h-[56px] w-full resize-none rounded-[var(--radius-md)] border border-[color:var(--line)] bg-white px-4 py-3 text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[color:var(--accent-soft)]"
                disabled={isTyping}
              />
              <div className="mt-2 flex flex-wrap items-center gap-2 px-1 text-xs text-[color:var(--muted)]">
                {hasTacitContext ? (
                  <span className="rounded-full bg-[color:var(--accent-soft)] px-2.5 py-1 font-semibold text-[color:var(--accent-strong)]">
                    已带入默会信息
                  </span>
                ) : null}
              </div>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isTyping || isAddingMaterial}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContextCard({
  context,
  intentPreset,
  onPromptClick,
  onSaveSuggestedEvent,
  disabled,
  savingEventKey,
  savedEventKeys,
}: {
  context: ChatContextState;
  intentPreset: IntentPreset | null;
  onPromptClick: (question: string) => void;
  onSaveSuggestedEvent: (item: SuggestedEventDraft) => void;
  disabled: boolean;
  savingEventKey: string | null;
  savedEventKeys: string[];
}) {
  const recommendedQuestions = (intentPreset ? Array.from(new Set([...intentPreset.questions, ...context.suggestedPrompts])) : context.suggestedPrompts).slice(0, 2);

  return (
    <div className="space-y-3 rounded-[var(--radius)] border border-[color:var(--line)] bg-white/78 p-4 shadow-[0_18px_36px_rgba(23,32,51,0.06)] md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--brand-strong)]">
            <Compass className="h-3.5 w-3.5" />
            这次世界易追问
          </div>
          <h3 className="mt-2 text-lg font-bold text-[color:var(--ink)]">
            {context.report ? `已锚定报告 ${context.report.pattern} / ${context.report.currentDaYun}` : '当前对话未绑定具体报告'}
          </h3>
        </div>
        <Link
          href={context.report ? `/result/${context.report.id}` : '/events'}
          className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius)] border border-[color:var(--hairline-strong)] bg-[color:var(--paper)] px-3 text-sm font-semibold text-[color:var(--ink-3)] hover:border-[color:var(--brand)]"
        >
          {context.report ? '返回报告' : '查看事件'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {context.focusAreas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {context.focusAreas.map((item) => (
            <span key={item} className="rounded-md bg-[color:var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[color:var(--accent-strong)]">
              {item}
            </span>
          ))}
        </div>
      )}

      {recommendedQuestions.length > 0 ? (
        <div className="grid gap-2 md:grid-cols-2">
          {recommendedQuestions.map((question) => (
            <QuickQuestionButton
              key={question}
              question={question}
              onClick={() => onPromptClick(question)}
              disabled={disabled}
            />
          ))}
        </div>
      ) : null}

      {(context.recentEvents.length > 0 || context.report) ? (
        <details className="rounded-lg border border-[color:var(--line)] bg-[color:var(--bg-elevated)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-[color:var(--muted)]">
            上下文详情
            <CalendarClock className="h-4 w-4" />
          </summary>
          <div className="grid gap-3 border-t border-[color:var(--line)] p-3 md:grid-cols-2">
            {context.report ? (
              <div className="rounded-lg bg-white px-3 py-3 text-sm leading-6 text-[color:var(--ink)]">
                {`结构 ${context.report.pattern}，阶段重点 ${context.report.currentDaYun} / ${context.report.bestWindow}。`}
              </div>
            ) : null}
            {context.recentEvents.map((event) => (
              <div key={event.id} className="rounded-lg bg-white px-3 py-3">
                <div className="text-sm font-semibold text-[color:var(--ink)]">{event.title}</div>
                <div className="mt-1 text-xs text-[color:var(--muted)]">
                  {event.date} · {mapEventTypeLabel(event.type)} · {mapImpactLabel(event.impact)}
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {context.validationSummary?.headline && (
        <div className="rounded-[var(--radius-md)] bg-[color:var(--bg-elevated)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">最近反馈</div>
          <div className="mt-2 text-xs leading-6 text-[color:var(--ink)]">{context.validationSummary.headline}</div>
        </div>
      )}

      {context.focusedEvent && (
        <div className="rounded-[var(--radius-md)] border border-[color:var(--alert)] bg-[color:var(--alert-soft)]/70 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--alert)]">本次重点问题</div>
          <div className="mt-2 text-base font-semibold text-[color:var(--ink)]">{context.focusedEvent.title}</div>
          <div className="mt-2 text-sm text-[color:var(--ink)]">
            {context.focusedEvent.reason || context.focusedEvent.notes || '当前对话应优先围绕这条已出现偏差的事件做纠偏分析。'}
          </div>
        </div>
      )}

      {context.correctionPrompts.length > 0 && (
        <div className="rounded-[var(--radius-md)] border border-[color:var(--signal)] bg-[color:var(--signal-soft)]/70 p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--signal-strong)]">建议先问</div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {context.correctionPrompts.map((item) => (
              <CorrectionPromptButton
                key={item.key}
                question={item.question}
                helper={item.helper}
                onClick={() => onPromptClick(item.question)}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {context.suggestedEventDrafts.length > 0 && (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--line)] bg-[rgba(178,149,93,0.08)] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">可以顺手记下的提醒</div>
          <div className="mt-3 grid gap-3">
            {context.suggestedEventDrafts.slice(0, 2).map((item) => {
              const eventKey = `suggestion:${item.key}`;
              const isSaved = savedEventKeys.includes(eventKey);

              return (
                <div key={item.key} className="rounded-[var(--radius)] bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[color:var(--ink)]">{item.title}</div>
                      <div className="mt-1 text-xs text-[color:var(--muted)]">
                        {item.date} · {mapEventTypeLabel(item.type)} · {mapImpactLabel(item.impact)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSaveSuggestedEvent(item)}
                      disabled={disabled || isSaved || savingEventKey === eventKey}
                      className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[color:var(--bg-elevated)] px-3 py-2 text-xs font-semibold text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaved ? <CheckCircle2 className="h-4 w-4 text-[color:var(--data-up)]" /> : null}
                      {isSaved ? '已保存' : savingEventKey === eventKey ? '保存中...' : '记下来'}
                    </button>
                  </div>
                  <div className="mt-3 text-sm text-[color:var(--ink)]">{item.reason}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function MaterialEvidenceComposer({
  materials,
  selectedKind,
  note,
  isAdding,
  error,
  disabled,
  fileInputRef,
  onKindChange,
  onNoteChange,
  onFileChange,
  onUploadClick,
  onAddText,
  onRemove,
}: {
  materials: ChatMaterialDraft[];
  selectedKind: ChatMaterialKind;
  note: string;
  isAdding: boolean;
  error: string;
  disabled: boolean;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onKindChange: (kind: ChatMaterialKind) => void;
  onNoteChange: (value: string) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onUploadClick: () => void;
  onAddText: () => void;
  onRemove: (materialId: string) => void;
}) {
  const selected = getMaterialOption(selectedKind);
  const SelectedIcon = selected.icon;
  const imageCount = materials.filter((item) => item.hasImage).length;

  return (
    <div className="rounded-[var(--radius)] border border-[color:var(--line)] bg-white/86 p-3">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={selected.accept}
        onChange={onFileChange}
        disabled={disabled || isAdding}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
            <Paperclip className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[color:var(--ink)]">资料维度</div>
            <div className="text-xs text-[color:var(--muted)]">{materials.length} 份 · {imageCount} 张图片</div>
          </div>
        </div>
        <Link href="/docs/structured-chat" className="text-xs font-semibold text-[color:var(--accent-strong)]">
          Docs
        </Link>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {materialKindOptions.map((item) => {
          const Icon = item.icon;
          const active = item.kind === selectedKind;

          return (
            <button
              key={item.kind}
              type="button"
              onClick={() => onKindChange(item.kind)}
              disabled={disabled}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? 'border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                  : 'border-[color:var(--line)] bg-white text-[color:var(--muted)] hover:border-[color:var(--accent)] hover:text-[color:var(--ink)]'
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_auto]">
        <div className="relative">
          <SelectedIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
          <input
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder={selected.placeholder}
            disabled={disabled}
            className="h-11 w-full rounded-lg border border-[color:var(--line)] bg-white pl-9 pr-3 text-sm text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)] focus:ring-4 focus:ring-[color:var(--accent-soft)]"
          />
        </div>
        <button
          type="button"
          onClick={onUploadClick}
          disabled={disabled || isAdding || materials.length >= maxMaterialCount}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[color:var(--line)] bg-white px-3 text-xs font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          title="添加图片或文件"
        >
          <ImagePlus className="h-4 w-4" />
          {isAdding ? '读取中' : '图片/文件'}
        </button>
        <button
          type="button"
          onClick={onAddText}
          disabled={disabled || isAdding || materials.length >= maxMaterialCount}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[color:var(--bg-elevated)] px-3 text-xs font-semibold text-[color:var(--ink)] transition hover:bg-[color:var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
          title="添加摘要"
        >
          <Plus className="h-4 w-4" />
          摘要
        </button>
      </div>

      {materials.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {materials.map((item) => (
            <MaterialChip key={item.id} material={item} onRemove={onRemove} />
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] leading-5 text-[color:var(--muted)]">
        <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--bg-elevated)] px-2.5 py-1 font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" />
          先遮挡证件号、住址、手机号
        </span>
        {selectedKind === 'legal_document' ? (
          <span className="rounded-full bg-[color:var(--signal-soft)] px-2.5 py-1 font-semibold text-[color:var(--signal-strong)]">文书只做结构阅读</span>
        ) : null}
        {error ? <span className="font-semibold text-[color:var(--signal-strong)]">{error}</span> : null}
      </div>
    </div>
  );
}

function MaterialChip({
  material,
  onRemove,
  readOnly = false,
}: {
  material: ChatMaterialDisplay;
  onRemove?: (materialId: string) => void;
  readOnly?: boolean;
}) {
  const option = getMaterialOption(material.kind);
  const Icon = option.icon;
  const detail = [
    material.fileName || material.note || '',
    formatFileSize(material.size),
    material.imageIncluded ? '已带图' : material.hasImage ? '图片摘要' : '',
  ].filter(Boolean).join(' · ');

  return (
    <div className="group inline-flex max-w-full items-center gap-2 rounded-lg border border-[color:var(--line)] bg-white/88 px-2.5 py-2 text-xs text-[color:var(--ink)]">
      {material.previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={material.previewUrl} alt={material.label} className="h-8 w-8 rounded-md object-cover" />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-bold">{material.label}</span>
        {detail ? <span className="block max-w-[14rem] truncate text-[11px] text-[color:var(--muted)]">{detail}</span> : null}
      </span>
      {!readOnly && onRemove ? (
        <button
          type="button"
          onClick={() => onRemove(material.id)}
          className="rounded-full p-1 text-[color:var(--muted)] transition hover:bg-[color:var(--bg-sunken)] hover:text-[color:var(--ink)]"
          aria-label={`移除${material.label}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

type IntentPreset = {
  entryLabel: string;
  helper: string;
  placeholder: string;
  prefillQuestion: string;
  questions: string[];
};

function getIntentPreset(intent: string): IntentPreset | null {
  const preset = getChatIntentPreset(intent);
  if (!preset) {
    return null;
  }

  return {
    entryLabel: preset.entryLabel,
    helper: preset.helper,
    placeholder: preset.placeholder,
    prefillQuestion: preset.prefillQuestion,
    questions: preset.questions,
  };
}

function MessageBubble({
  message,
  previousUserQuestion,
  onSaveEvent,
  onDelete,
  onRegenerate,
  onStartEdit,
  onCancelEdit,
  onSubmitEdit,
  isEditing,
  editingContent,
  onEditingContentChange,
  isSaving,
  isSaved,
  isActing,
  onCopy,
  copied,
}: {
  message: ChatMessage;
  previousUserQuestion: string;
  onSaveEvent: (question: string, answer: string, key: string) => void;
  onDelete: (messageId: string) => void;
  onRegenerate: (messageId: string) => void;
  onStartEdit: (message: ChatMessage) => void;
  onCancelEdit: () => void;
  onSubmitEdit: (messageId: string) => void;
  isEditing: boolean;
  editingContent: string;
  onEditingContentChange: (value: string) => void;
  isSaving: boolean;
  isSaved: boolean;
  isActing: boolean;
  onCopy: (messageId: string, content: string) => void;
  copied: boolean;
}) {
  const time = formatChatTime(message.timestamp);

  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-2xl rounded-[1.75rem] bg-[linear-gradient(135deg,var(--accent),var(--accent-strong))] px-5 py-4 text-white shadow-[0_14px_32px_rgba(178,149,93,0.2)]">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editingContent}
                onChange={(event) => onEditingContentChange(event.target.value)}
                rows={3}
                className="w-full resize-none rounded-[var(--radius)] border border-white/20 bg-white/12 px-4 py-3 text-xs leading-6 text-white outline-none placeholder:text-white/60"
                placeholder="修改你的问题"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-white/70">修改后会基于这条问题重新生成后续回答。</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onCancelEdit}
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-2 text-xs font-semibold text-white/88"
                  >
                    <X className="h-3.5 w-3.5" />
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={() => onSubmitEdit(message.id)}
                    disabled={isActing}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-[color:var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Check className="h-3.5 w-3.5" />
                    {isActing ? '提交中...' : '重新提交'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs leading-6">{message.content}</p>
              {message.tacitSummary ? (
                <div className="mt-3 rounded-[1rem] border border-white/18 bg-white/10 px-3 py-2.5 text-[11px] leading-6 text-white/90">
                  <div className="font-semibold text-white">本轮默会信息</div>
                  <div className="mt-1 text-white/82">{message.tacitSummary}</div>
                </div>
              ) : null}
              {message.materials?.length ? (
                <div className="mt-3 rounded-[1rem] border border-white/18 bg-white/10 px-3 py-2.5 text-[11px] leading-6 text-white/90">
                  <div className="font-semibold text-white">本轮资料</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.materials.map((material) => (
                      <span key={material.id} className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 font-semibold text-white/88">
                        {material.label}{material.hasImage ? ' · 图片' : ''}
                      </span>
                    ))}
                  </div>
                  {message.materialSummary ? <div className="mt-2 text-white/82">{message.materialSummary}</div> : null}
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-white/75">
                <div className="flex items-center gap-2">
                  <span>{time}</span>
                  {message.edited ? (
                    <span className="rounded-full border border-white/20 px-2 py-0.5 font-semibold text-white/88">已编辑</span>
                  ) : null}
                  {message.tacitSummary ? (
                    <span className="rounded-full border border-white/20 px-2 py-0.5 font-semibold text-white/88">已带默会信息</span>
                  ) : null}
                  {message.materials?.length ? (
                    <span className="rounded-full border border-white/20 px-2 py-0.5 font-semibold text-white/88">已带资料</span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onStartEdit(message)}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5 font-semibold text-white/88"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(message.id)}
                    disabled={isActing}
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 px-3 py-1.5 font-semibold text-white/88 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {isActing ? '删除中...' : '删除'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-3xl rounded-[1.75rem] border border-[color:var(--line)] bg-white px-5 py-4 shadow-[0_16px_32px_rgba(23,32,51,0.06)]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[color:var(--ink)]">结构回复</span>
          {message.llmUsed === false && (
            <span className="rounded-full bg-[rgba(201,161,74,0.16)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--signal-strong)]">稳定版</span>
          )}
          {message.regenerated ? (
            <span className="rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--muted)]">已重生成</span>
          ) : null}
          {message.edited ? (
            <span className="rounded-full bg-[color:var(--bg-sunken)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--muted)]">源问题已编辑</span>
          ) : null}
        </div>
        <div className="mt-3">
          <ChatMarkdown content={message.content} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[color:var(--muted)]">
          <span>
            {message.llmUsed
              ? '结合当前报告与对话内容生成'
              : '上游模型不稳定，当前先展示稳定版结构回复；稍后可点重生成补全深度。'}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <span>{time}</span>
            <button
              type="button"
              onClick={() => onRegenerate(message.id)}
              disabled={isActing}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--bg-elevated)] px-3 py-2 font-semibold text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" />
              {isActing ? '处理中...' : '重生成'}
            </button>
            {previousUserQuestion && (
              <button
                type="button"
                onClick={() => onSaveEvent(previousUserQuestion, message.content, message.id)}
                disabled={isSaving || isSaved}
                className="inline-flex items-center gap-2 rounded-full bg-[color:var(--bg-elevated)] px-3 py-2 text-xs font-semibold text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaved ? <CheckCircle2 className="h-4 w-4 text-[color:var(--data-up)]" /> : null}
                {isSaved ? '已记下' : isSaving ? '保存中...' : '记提醒'}
              </button>
            )}
            <button
              type="button"
              onClick={() => onCopy(message.id, message.content)}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--bg-elevated)] px-3 py-2 font-semibold text-[color:var(--ink)]"
            >
              <Copy className="h-4 w-4" />
              {copied ? '已复制' : '复制'}
            </button>
            <button
              type="button"
              onClick={() => onDelete(message.id)}
              disabled={isActing}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--bg-elevated)] px-3 py-2 font-semibold text-[color:var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickQuestionButton({ question, onClick, disabled = false }: QuickQuestionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-[var(--radius-md)] border border-[color:var(--line)] bg-white px-4 py-4 text-left text-xs leading-6 text-[color:var(--ink)] transition hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-soft)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="text-xs tracking-[0.18em] text-[color:var(--muted)]">结构化追问</div>
      <div className="mt-2">{question}</div>
    </button>
  );
}

function CorrectionPromptButton({
  question,
  helper,
  onClick,
  disabled = false,
}: {
  question: string;
  helper: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-[var(--radius-md)] border border-[color:var(--signal)] bg-white px-4 py-4 text-left transition hover:border-[color:var(--signal)] hover:bg-[color:var(--signal-soft)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="text-sm font-semibold leading-7 text-[color:var(--ink)]">{question}</div>
      <div className="mt-2 text-xs text-[color:var(--muted)]">{helper}</div>
    </button>
  );
}

function findLatestScopedTacitContext(messages: ChatMessage[]) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const tacitContext = messages[index]?.tacitContext;
    if (messages[index]?.role === 'user' && hasTacitKnowledgeInput(tacitContext)) {
      return cloneTacitKnowledgeInput(tacitContext);
    }
  }

  return createEmptyTacitKnowledgeInput();
}

function buildPreviousUserQuestionMap(messages: ChatMessage[]) {
  const previousUserQuestions: Record<string, string> = {};
  let latestUserQuestion = '';

  for (const message of messages) {
    previousUserQuestions[message.id] = latestUserQuestion;
    if (message.role === 'user') {
      latestUserQuestion = message.content;
    }
  }

  return previousUserQuestions;
}

function mapEventTypeLabel(type: string) {
  switch (type) {
    case 'career':
      return '事业';
    case 'wealth':
      return '财富';
    case 'marriage':
      return '关系';
    case 'health':
      return '健康';
    case 'family':
      return '家庭';
    default:
      return '其他';
  }
}

function mapImpactLabel(impact: ChatContextEvent['impact']) {
  switch (impact) {
    case 'positive':
      return '积极';
    case 'negative':
      return '风险';
    default:
      return '中性';
  }
}

function mapValidationLabel(status: ChatContextEvent['validationStatus']) {
  switch (status) {
    case 'accurate':
      return '已验证准确';
    case 'drift':
      return '已记录偏差';
    default:
      return '待验证';
  }
}
