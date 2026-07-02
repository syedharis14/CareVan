import { cssVariables } from '@carevan/shared';

/**
 * Injects the shared design tokens as CSS variables on :root, so admin consumes the
 * single source of truth instead of hardcoding hex values.
 */
export function TokenStyle() {
  const vars = Object.entries(cssVariables)
    .map(([k, v]) => `${k}:${v}`)
    .join(';');
  return <style dangerouslySetInnerHTML={{ __html: `:root{${vars}}` }} />;
}
