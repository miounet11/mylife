export function useChatEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  return { events, isLoading };
}
