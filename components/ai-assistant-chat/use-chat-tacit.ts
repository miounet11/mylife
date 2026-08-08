export function useChatTacit() {
  const [tacitInputs, setTacitInputs] = useState<any[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  return { tacitInputs, summary, loading };
}
