import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CITY_LONGITUDES,
  formatPlaceWithLongitude,
  getQuickPickCities,
  parseLongitudeFromPlaceText,
  resolveCityLongitude,
} from '@/lib/geo/city-longitudes';

describe('city-longitudes', () => {
  it('formats place with signed °E for engine parse', () => {
    assert.equal(formatPlaceWithLongitude('成都', 104.0665), '成都 · 104.1°E');
    assert.equal(formatPlaceWithLongitude('纽约', -74.006), '纽约 · -74°E');
  });

  it('parses explicit longitude from place text', () => {
    assert.equal(parseLongitudeFromPlaceText('成都 · 104.1°E'), 104.1);
    assert.equal(parseLongitudeFromPlaceText('纽约 · -74°E'), -74);
    assert.equal(parseLongitudeFromPlaceText('longitude: 121.5'), 121.5);
    assert.equal(parseLongitudeFromPlaceText('纯文字无经度'), null);
  });

  it('resolves by city name substring', () => {
    const r = resolveCityLongitude('出生于成都武侯区');
    assert.ok(r);
    assert.equal(r?.source, 'city');
    assert.equal(r?.matchedPlace, '成都');
    assert.ok(Math.abs((r?.longitude || 0) - 104.1) < 0.2);
    assert.equal(r?.confidence, 'medium');
  });

  it('prefers explicit longitude over city name', () => {
    const r = resolveCityLongitude('成都 · 104.1°E');
    assert.ok(r);
    assert.equal(r?.source, 'explicit');
    assert.equal(r?.confidence, 'high');
    assert.equal(r?.longitude, 104.1);
  });

  it('resolves English city names', () => {
    const r = resolveCityLongitude('Shanghai');
    assert.ok(r);
    assert.equal(r?.matchedPlace, '上海');
    assert.ok((r?.longitude || 0) > 120);
  });

  it('returns null for unknown place without lon', () => {
    assert.equal(resolveCityLongitude(''), null);
    assert.equal(resolveCityLongitude('火星基地'), null);
  });

  it('quick picks are a non-empty subset of the table', () => {
    const picks = getQuickPickCities();
    assert.ok(picks.length >= 6);
    for (const p of picks) {
      assert.ok(CITY_LONGITUDES.some((c) => c.id === p.id));
      assert.ok(Number.isFinite(p.longitude));
    }
  });
});
