import fs from 'fs';
import path from 'path';

describe('profile page client loading stability', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'app/profile/page.tsx'),
    'utf8',
  );

  it('does not block the profile page on optional updates summary loading', () => {
    expect(source).toContain('PROFILE_HISTORY_TIMEOUT_MS = 12_000');
    expect(source).toContain('PROFILE_UPDATES_SUMMARY_TIMEOUT_MS = 5_000');
    expect(source).toContain('profile-history-timeout');
    expect(source).toContain('profile-updates-summary-timeout');
    expect(source).toContain('void loadHistory()');
    expect(source).toContain('void loadUpdatesSummary()');
    expect(source).not.toContain("Promise.all([\n          fetch('/api/history'");
  });

  it('aborts in-flight profile requests when the page unmounts', () => {
    expect(source).toContain('fetchJsonWithTimeout<ProfileResponse>');
    expect(source).toContain('fetchJsonWithTimeout<UpdatesSummaryResponse>');
    expect(source).toContain("abortControllerRef(historyControllerRef, 'profile-page-unmounted')");
    expect(source).toContain("abortControllerRef(updatesControllerRef, 'profile-page-unmounted')");
  });
});
