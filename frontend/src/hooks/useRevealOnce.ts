import { useEffect, useRef, useState } from "react";

/**
 * Scroll-reveal primitive for landing sections. Fires once when ~10% of the
 * section is visible, then disconnects — never re-hides.
 */
export function useRevealOnce<T extends HTMLElement = HTMLElement>(
  threshold = 0.1,
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible, threshold]);

  return [ref, visible];
}
