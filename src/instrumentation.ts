export async function onRequestError(
  err: { digest?: string; message?: string; stack?: string } & Error,
  _request: { path: string; method: string },
  _context: { routerKind: string; routePath: string }
) {
  // Full error details are logged here on the server before Next.js sanitizes them.
  // In production, the client only receives the `digest`; cross-reference it here.
  console.error(
    `[Server Error] digest=${err.digest ?? "none"} path=${_request.path}\n`,
    err
  );
}
