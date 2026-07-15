'use client';

import SubscriptionSettingsPanel from '@/components/subscription-settings-panel';

export default function NewsletterManager({
  initialEmail = '',
  autoLoad = false,
}: {
  initialEmail?: string;
  autoLoad?: boolean;
}) {
  return (
    <SubscriptionSettingsPanel
      initialEmail={initialEmail}
      autoLoad={autoLoad}
    />
  );
}