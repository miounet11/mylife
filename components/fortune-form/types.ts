import type { CaseTypeOption } from '@/lib/paipan-form';

export type EntryReadinessItem = {
  label: string;
  value: string;
  done: boolean;
};

export type ProgressSegment = {
  key: string;
  label: string;
  done: boolean;
};

export type FortuneFormProps = {
  returnHref?: string;
  returnLabel?: string;
  returnSource?: string;
};

export type { CaseTypeOption };
