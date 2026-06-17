export default function BenachrichtigungenPage() {
  console.log({
    heap: process.memoryUsage().heapUsed / 1024 / 1024 + " MB",
    rss: process.memoryUsage().rss / 1024 / 1024 + " MB",
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900">Benachrichtigungen</h1>
      <p className="mt-1 text-sm text-gray-500">Alle Benachrichtigungen und Mitteilungen.</p>
    </div>
  );
}
