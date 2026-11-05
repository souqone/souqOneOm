export function isPrismaUniqueError(err: unknown, fieldOrConstraint?: string): boolean {
  if ((err as { code?: string } | null)?.code !== 'P2002') {
    return false;
  }
  if (!fieldOrConstraint) {
    return true;
  }
  const target = (err as { meta?: { target?: unknown } } | null)?.meta?.target;
  if (Array.isArray(target)) {
    return target.some((t) => typeof t === 'string' && (t === fieldOrConstraint || t.includes(fieldOrConstraint)));
  }
  if (typeof target === 'string') {
    return target === fieldOrConstraint || target.includes(fieldOrConstraint);
  }
  return false;
}
