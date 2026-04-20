import { buildWorldYiPublicationMechanismSnapshot } from '@/lib/world-yi-publication-mechanism';

function parseFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

function main() {
  const json = parseFlag('json');
  const snapshot = buildWorldYiPublicationMechanismSnapshot();

  if (json) {
    console.log(JSON.stringify(snapshot, null, 2));
    return;
  }

  const lines = [
    'World Yi Publication Mechanism',
    `checkedAt: ${snapshot.checkedAt}`,
    `weeklySlots: ${snapshot.weeklySlots}`,
    `mode: ${snapshot.expansion.mode}`,
    '',
    'Logic Layers:',
    ...snapshot.logicLayers.map((item) => `- ${item.title}: ${item.description}`),
    '',
    'Expansion:',
    `- shouldExpand=${snapshot.expansion.shouldExpand} reserveFloor=${snapshot.expansion.minQueuedTargetsPerLane}`,
    ...snapshot.expansion.reasons.map((item) => `- ${item}`),
    '',
    'Lane Summary:',
    ...snapshot.lanes.map((lane) => (
      `- ${lane.label}: targets=${lane.targetCount} published=${lane.publishedCount} missing=${lane.missingCount} draftOnly=${lane.draftOnlyCount} readyPromote=${lane.readyPromoteCount}`
    )),
    '',
    'Next Slots:',
    ...snapshot.nextSlots.map((slot) => (
      `- [${slot.slot}] ${slot.laneLabel} ${slot.action} ${slot.title} (${slot.contentType}, ${slot.locale}, ${slot.market})`
    )),
  ];

  console.log(lines.join('\n'));
}

main();
