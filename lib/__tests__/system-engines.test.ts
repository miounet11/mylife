import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getPageSeoGeoPack, isPagePackGeoReady } from '@/lib/page-seo-geo-packs';
import {
  SYSTEM_ENGINE_COUNT,
  SYSTEM_ENGINES,
  engineCapabilityLine,
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

  it('registers /engines as a GEO-ready capability page', () => {
    const pack = getPageSeoGeoPack('/engines');
    assert.ok(pack);
    assert.equal(pack!.path, '/engines');
    assert.ok(isPagePackGeoReady(pack));
  });
});
