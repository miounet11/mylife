'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { trackClientEvent } from '@/lib/analytics-client';
import {
  type ChatMaterialDraft,
  type ChatMaterialKind,
  getMaterialOption,
  maxInlineImageBytes,
  maxMaterialCount,
  readFileAsDataUrl,
} from '@/components/ai-assistant-chat/chat-helpers';

interface UseChatMaterialsParams {
  intent: string;
  source: string;
  ctaStrategyKey: string;
  sourceFamily: string;
}

export function useChatMaterials({ intent, source, ctaStrategyKey, sourceFamily }: UseChatMaterialsParams) {
  const [materials, setMaterials] = useState<ChatMaterialDraft[]>([]);
  const [selectedMaterialKind, setSelectedMaterialKind] = useState<ChatMaterialKind>('face_photo');
  const [materialNote, setMaterialNote] = useState('');
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [materialError, setMaterialError] = useState('');
  const materialFileInputRef = useRef<HTMLInputElement>(null);

  const isPalmistryUploadFlow = intent === 'palmistry-reading';

  // 根据 intent 自动切换默认资料维度
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

  const resetMaterials = () => {
    setMaterials([]);
    setMaterialNote('');
    setMaterialError('');
  };

  return {
    materials,
    selectedMaterialKind,
    materialNote,
    isAddingMaterial,
    materialError,
    materialFileInputRef,
    setMaterials,
    setMaterialNote,
    setMaterialError,
    setSelectedMaterialKind,
    handleMaterialFileChange,
    handleAddTextMaterial,
    handleRemoveMaterial,
    resetMaterials,
  };
}
