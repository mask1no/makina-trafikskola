export type TabMatch = {
  href: string;
  exact?: boolean;
};

function pathOf(href: string) {
  return href.split("?")[0] ?? href;
}

function queryOf(href: string) {
  return new URLSearchParams(href.split("?")[1] ?? "");
}

export function currentTabHref(
  pathname: string,
  search: string,
  tabs: TabMatch[],
) {
  const params = new URLSearchParams(search);
  const ranked = tabs
    .map((tab) => {
      const path = pathOf(tab.href);
      const required = queryOf(tab.href);
      const pathMatches = tab.exact
        ? pathname === path
        : pathname === path ||
          (path.split("/").filter(Boolean).length > 1 &&
            pathname.startsWith(`${path}/`));
      if (!pathMatches) return null;
      for (const [key, value] of required) {
        if (params.get(key) !== value) return null;
      }
      return {
        href: tab.href,
        specificity: path.length + required.size * 100,
        querySize: required.size,
        path,
      };
    })
    .filter((item) => item !== null)
    .sort((a, b) => b.specificity - a.specificity);

  const best = ranked[0];
  if (!best) return null;
  if (best.querySize > 0) return best.href;

  const blocked = tabs.some((tab) => {
    if (pathOf(tab.href) !== best.path) return false;
    const required = queryOf(tab.href);
    if (required.size === 0) return false;
    for (const key of required.keys()) {
      if (params.has(key)) return true;
    }
    return false;
  });
  return blocked ? null : best.href;
}
