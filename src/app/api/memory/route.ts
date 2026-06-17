export async function GET() {
  const mem = process.memoryUsage();
  const toMB = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + "MB";

  return Response.json({
    heapUsed: toMB(mem.heapUsed),
    heapTotal: toMB(mem.heapTotal),
    rss: toMB(mem.rss),
    external: toMB(mem.external),
    timestamp: new Date().toISOString(),
  });
}
