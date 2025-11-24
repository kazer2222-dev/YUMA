/**
 * Helper function to resolve route params that may be a Promise (Next.js 14+)
 */
export async function resolveParams<T extends Record<string, string>>(
  params: Promise<T> | T
): Promise<T> {
  return Promise.resolve(params);
}
