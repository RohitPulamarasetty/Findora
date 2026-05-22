"use client";

/**
 * useNavTransition — wraps Next's `router.push` with `useTransition` so that
 * navigation kicks into a React transition. Two effects:
 *
 *   1. While the next route is loading on the server, `isPending` stays true.
 *      Callers can use it to dim a card, swap an icon to a spinner, or pre-
 *      activate a nav pill. This is the "instant visual feedback" lever.
 *
 *   2. Subsequent calls to `navigate(href)` while `isPending` is still true
 *      with the *same* href are swallowed. This stops tap-spam from queueing
 *      duplicate `router.push` calls into the same route. Different hrefs
 *      are still allowed so the user can change their mind mid-transition.
 *
 * `linkProps(href)` is a convenience for wrapping existing `<Link>` elements:
 * it returns an `onClick` that intercepts plain left-clicks and routes them
 * through the transition. Modifier-key / non-primary clicks fall through to
 * the native `<Link>` so cmd-/ctrl-click "open in new tab" still works.
 *
 * Intentionally scoped — we only apply this to nav surfaces (bottom nav,
 * sidebar, cards). Wrapping every `<Link>` in the app would do nothing for
 * lightweight routes and just adds an extra render.
 */
import { useRouter } from "next/navigation";
import { useCallback, useRef, useTransition, type MouseEvent } from "react";

export function useNavTransition() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Tracks the href of the in-flight navigation. Cleared lazily when the
  // transition resolves and React re-runs this hook with isPending=false.
  const inFlightHrefRef = useRef<string | null>(null);

  if (!isPending && inFlightHrefRef.current !== null) {
    inFlightHrefRef.current = null;
  }

  const navigate = useCallback(
    (href: string) => {
      if (isPending && inFlightHrefRef.current === href) return;
      inFlightHrefRef.current = href;
      startTransition(() => {
        router.push(href);
      });
    },
    [router, isPending]
  );

  const linkProps = useCallback(
    (href: string) => ({
      onClick: (e: MouseEvent<HTMLAnchorElement>) => {
        // Let the browser handle modifier-clicks (new tab/window, save link).
        if (
          e.defaultPrevented ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        ) {
          return;
        }
        e.preventDefault();
        if (isPending && inFlightHrefRef.current === href) return;
        inFlightHrefRef.current = href;
        startTransition(() => {
          router.push(href);
        });
      },
    }),
    [router, isPending]
  );

  return { isPending, navigate, linkProps, pendingHref: inFlightHrefRef.current };
}
