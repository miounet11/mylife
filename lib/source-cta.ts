export function buildSourceCtaStrategy(source = 'direct') {
  return {
    strategyKey: 'default',
    sourceFamily: 'organic',
    reportSecondaryLabel: '顾问开场',
    reportEventLabel: '记录事件',
  };
}