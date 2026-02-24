export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-purple-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            🔮
          </div>
        </div>
        <p className="text-purple-700 font-medium animate-pulse">正在加载命理宇宙...</p>
      </div>
    </div>
  );
}
