export function updateSearchParams(
  url: URL,
  updates: Record<string, string | number | null>,
): URL {
  const next = new URL(url);
  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === '') {
      next.searchParams.delete(key);
    } else {
      next.searchParams.set(key, String(value));
    }
  });
  return next;
}

export function pushSearchParams(
  updates: Record<string, string | number | null>,
) {
  const current = new URL(window.location.href);
  const next = updateSearchParams(current, updates);
  if (next.href !== current.href) {
    window.history.pushState(
      null,
      '',
      `${next.pathname}${next.search}${next.hash}`,
    );
  }
}
