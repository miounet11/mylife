/**
 * Experience skill registry — user-visible teachers as capability packages.
 * Internal agentic agents (core_constitution, …) stay off this registry.
 */

import { listTeachers, getTeacher, type TeacherDefinition, type TeacherId } from '@/lib/teachers';
import type { ExperienceSkill, SkillCapabilityMode } from '@/lib/experience-kernel/types';

function capabilityForTeacher(t: TeacherDefinition): SkillCapabilityMode {
  if (t.id === 'practice') return 'write_events';
  if (t.context.includes('report') && t.tier === 'p0') return 'read_chart';
  return 'general';
}

export function teacherToSkill(t: TeacherDefinition): ExperienceSkill {
  return {
    id: `skill.teacher.${t.id}`,
    name: t.name,
    tagline: t.tagline,
    capability: capabilityForTeacher(t),
    contextSlots: t.context,
    starters: t.starters.slice(0, 6),
    teacherId: t.id,
  };
}

export function listExperienceSkills(opts?: { galleryOnly?: boolean }): ExperienceSkill[] {
  return listTeachers(opts?.galleryOnly ? { galleryOnly: true } : undefined).map(teacherToSkill);
}

export function resolveExperienceSkill(input: {
  skillId?: string | null;
  teacherId?: string | null;
  intent?: string | null;
}): ExperienceSkill {
  const rawSkill = `${input.skillId || ''}`.trim();
  if (rawSkill.startsWith('skill.teacher.')) {
    const tid = rawSkill.replace(/^skill\.teacher\./, '') as TeacherId;
    return teacherToSkill(getTeacher(tid));
  }
  if (input.teacherId) {
    return teacherToSkill(getTeacher(input.teacherId));
  }
  // intent → teacher (mirrors chat-teacher-runtime)
  const intent = `${input.intent || ''}`.trim().toLowerCase();
  const intentMap: Record<string, TeacherId> = {
    career: 'career',
    wealth: 'wealth',
    marriage: 'relationship',
    relationship: 'relationship',
    health: 'health',
    month: 'timing',
    risk: 'timing',
    timing: 'timing',
    move: 'geo',
    geo: 'geo',
    followup: 'practice',
    general: 'overview',
    overview: 'overview',
  };
  return teacherToSkill(getTeacher(intentMap[intent] || 'overview'));
}

export function formatSkillSystemAddon(skill: ExperienceSkill): string {
  return [
    `【当前顾问技能】${skill.name}`,
    skill.tagline,
    `能力模式：${skill.capability}`,
    skill.contextSlots.length
      ? `优先使用上下文：${skill.contextSlots.join('、')}`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
}
