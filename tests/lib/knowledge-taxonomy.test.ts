import {
  getKnowledgeSources,
  getKnowledgeTopics,
  KNOWLEDGE_OBJECT_TYPES,
  RIGHTS_STATUS_LABELS,
} from '@/lib/knowledge-taxonomy';

describe('knowledge taxonomy', () => {
  test('exports unique topic keys', () => {
    const topics = getKnowledgeTopics();
    const keys = topics.map((topic) => topic.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  test('exports unique source ids', () => {
    const sources = getKnowledgeSources();
    const ids = sources.map((source) => source.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('source priorities stay within the supported levels', () => {
    const sources = getKnowledgeSources();
    expect(sources.every((source) => [0, 1, 2].includes(source.priority))).toBe(true);
  });

  test('all topic object types are supported', () => {
    const supportedTypes = new Set(KNOWLEDGE_OBJECT_TYPES);
    const topics = getKnowledgeTopics();

    expect(
      topics.every((topic) => topic.objectTypes.every((objectType) => supportedTypes.has(objectType)))
    ).toBe(true);
  });

  test('rights labels cover all source rights statuses', () => {
    const sources = getKnowledgeSources();
    expect(
      sources.every((source) => Object.prototype.hasOwnProperty.call(RIGHTS_STATUS_LABELS, source.rightsStatus))
    ).toBe(true);
  });
});
