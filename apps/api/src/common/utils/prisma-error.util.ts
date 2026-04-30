export function isPrismaUniqueError(err: unknown): boolean {
  return (err as { code?: string } | null)?.code === 'P2002';
}
