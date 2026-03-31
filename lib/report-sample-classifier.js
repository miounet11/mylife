const KNOWN_TEST_REPORT_NAMES = new Set([
  '测试A',
  '验证B',
  '测试用户',
  '测试用户2',
  '案例1',
  '案例2',
  '甲',
  '乙',
  '丙',
  '哈哈',
  '即时局',
  'x',
]);

function normalizeReportSampleName(name) {
  return `${name || ''}`.trim();
}

function isSuspiciousWeakName(name) {
  const normalized = normalizeReportSampleName(name);
  if (!normalized) return false;
  if (/^\d+$/.test(normalized)) return true;
  if (/^[a-z]{2,3}$/i.test(normalized)) return true;
  return false;
}

function isLikelyTestReportName(name) {
  const normalized = normalizeReportSampleName(name);
  if (!normalized) return true;
  if (KNOWN_TEST_REPORT_NAMES.has(normalized)) return true;
  if (/^测试/.test(normalized)) return true;
  if (/^案例\d+$/.test(normalized)) return true;
  if (/^(甲|乙|丙|丁|A|B|C)$/.test(normalized)) return true;
  if (normalized.length === 1 && /^[a-z]$/i.test(normalized)) return true;
  if (isSuspiciousWeakName(normalized)) return true;
  return false;
}

function isLikelyRealUserReportName(name) {
  return !isLikelyTestReportName(name);
}

module.exports = {
  KNOWN_TEST_REPORT_NAMES,
  normalizeReportSampleName,
  isSuspiciousWeakName,
  isLikelyTestReportName,
  isLikelyRealUserReportName,
};
