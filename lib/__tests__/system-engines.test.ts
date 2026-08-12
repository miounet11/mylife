import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getPageSeoGeoPack, isPagePackGeoReady } from '@/lib/page-seo-geo-packs';
import {
  NATAL_CHAIN_ORDER,
  SYSTEM_ENGINE_COUNT,
  SYSTEM_ENGINES,
  SYSTEM_SUPPORT_MODULES,
  engineCapabilityLine,
  getSystemEngine,
  getSystemEngineCatalog,
} from '@/lib/system-engines';

describe('system engines catalog', () => {
  it('registers 15 product engines across 3 families', () => {
    const catalog = getSystemEngineCatalog();
    assert.equal(SYSTEM_ENGINE_COUNT, 15);
    assert.equal(catalog.count, 15);
    assert.equal(catalog.natal, 7);
    assert.equal(catalog.tool, 6);
    assert.equal(catalog.time, 2);
    assert.equal(catalog.natal + catalog.tool + catalog.time, 15);
    assert.match(engineCapabilityLine(), /15/);
  });

  it('every engine has unique id, href, version, and source path', () => {
    const ids = new Set(SYSTEM_ENGINES.map((e) => e.id));
    assert.equal(ids.size, SYSTEM_ENGINES.length);
    for (const engine of SYSTEM_ENGINES) {
      assert.ok(engine.name);
      assert.ok(engine.href.startsWith('/'));
      assert.ok(engine.version);
      assert.ok(engine.path.startsWith('lib/'));
      const abs = join(process.cwd(), engine.path);
      const asFile = abs.endsWith('.ts') || abs.endsWith('.tsx');
      assert.ok(existsSync(abs) || existsSync(`${abs}.ts`) || existsSync(`${abs}.tsx`) || (!asFile && existsSync(abs)), engine.path);
    }
  });

  it('every engine documents an entry point and tests/whenToUse', () => {
    for (const engine of SYSTEM_ENGINES) {
      assert.ok(engine.entry, engine.id);
      assert.ok(engine.whenToUse, engine.id);
      assert.ok(Array.isArray(engine.dependsOn), engine.id);
      assert.ok(Array.isArray(engine.tests), engine.id);
    }
    assert.equal(getSystemEngine('yongshen')?.entry, 'determineYongShen');
    assert.deepEqual(NATAL_CHAIN_ORDER, ['pillars', 'yongshen', 'dayun', 'kline', 'shensha']);
    assert.ok(SYSTEM_SUPPORT_MODULES.some((m) => m.id === 'natal-engine-chain'));
  });

  it('registers /engines as a GEO-ready capability page', () => {
    const pack = getPageSeoGeoPack('/engines');
    assert.ok(pack);
    assert.equal(pack!.path, '/engines');
    assert.ok(isPagePackGeoReady(pack));
  });
});
