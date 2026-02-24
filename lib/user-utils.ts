export function getOrCreateGuestUserId() {
  // In a real app with auth, you'd use session/cookies
  // For now, generate a random ID for the session
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
