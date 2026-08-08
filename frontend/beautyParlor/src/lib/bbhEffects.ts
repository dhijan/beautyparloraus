import { useEffect } from "react";

// Scroll choreography for the Brow Beauty Hub design: reveal-on-enter,
// parallax blobs, the sticky hero's scale/dim, the word-by-word lit
// paragraph, the auto-hiding header and the cursor ring.
//
// Re-runs whenever the route changes so freshly mounted sections get
// observed. Everything is torn down in the cleanup, so re-running is cheap.

const REVEAL_STAGGER = 85;
// If the observer never fires (element off-screen in a collapsed parent,
// a browser that throttled us), show the content anyway rather than
// leaving the page blank.
const REVEAL_FAILSAFE = 2600;

export function useBbhEffects(routeKey: string) {
  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const timers: number[] = [];

    const observer = reduced
      ? null
      : new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;

              const el = entry.target as HTMLElement;
              const order = Number(el.dataset.reveal) || 0;

              timers.push(
                window.setTimeout(
                  () => el.classList.add("bbh-in"),
                  order * REVEAL_STAGGER
                )
              );

              observer?.unobserve(el);
            });
          },
          { rootMargin: "0px 0px -8% 0px", threshold: 0.06 }
        );

    // Cards rendered after an API response mount later than this effect
    // runs, so scan on mutation as well as up front — otherwise anything
    // fetched stays stuck at opacity 0.
    // Tracked per effect run, not on the element: React StrictMode mounts,
    // tears down and remounts in dev, and a marker that outlived the
    // teardown would make the second run skip every element.
    const watched = new WeakSet<HTMLElement>();

    const scan = () => {
      document
        .querySelectorAll<HTMLElement>("[data-reveal]:not(.bbh-in)")
        .forEach((el) => {
          if (watched.has(el)) return;
          watched.add(el);

          if (!observer) {
            el.classList.add("bbh-in");
            return;
          }

          observer.observe(el);
          timers.push(
            window.setTimeout(() => el.classList.add("bbh-in"), REVEAL_FAILSAFE)
          );
        });
    };

    scan();

    const mutations = new MutationObserver(scan);
    mutations.observe(document.body, { childList: true, subtree: true });

    const parallax = Array.from(
      document.querySelectorAll<HTMLElement>("[data-parallax]")
    );
    const hero = document.querySelector<HTMLElement>("[data-hero]");
    const heroInner = document.querySelector<HTMLElement>("[data-hero-inner]");
    const heroMedia = document.querySelector<HTMLElement>("[data-hero-media]");
    const lit = document.querySelector<HTMLElement>("[data-hl-wrap]");
    const header = document.querySelector<HTMLElement>("[data-header]");
    const cursor = document.querySelector<HTMLElement>("[data-cursor]");

    let lastY: number | null = null;
    let drift = 0;
    let hidden = false;

    const update = () => {
      const y = window.scrollY;

      if (!reduced) {
        parallax.forEach((el) => {
          const rate = parseFloat(el.dataset.parallax || "0");
          el.style.transform = `translate3d(0,${(y * rate).toFixed(1)}px,0)`;
        });
      }

      if (hero && !reduced) {
        const progress = Math.min(1, Math.max(0, y / (hero.offsetHeight || 1)));

        hero.style.transform = `scale(${(1 - progress * 0.06).toFixed(4)})`;
        hero.style.filter = `brightness(${(1 - progress * 0.35).toFixed(3)})`;

        if (heroMedia) {
          heroMedia.style.opacity = (1 - progress * 0.25).toFixed(3);
        }

        if (heroInner) {
          heroInner.style.transform = `translate3d(0,${(progress * -70).toFixed(
            1
          )}px,0)`;
          heroInner.style.opacity = (1 - progress * 1.25).toFixed(3);
        }
      }

      if (lit) {
        const box = lit.getBoundingClientRect();
        const vh = window.innerHeight;
        const progress = Math.min(
          1,
          Math.max(0, (vh * 0.86 - box.top) / (box.height + vh * 0.42))
        );

        lit.style.setProperty("--lit", (progress * 32).toFixed(2));
      }

      if (header) {
        header.classList.toggle("stuck", y > 40);

        const delta = y - (lastY ?? y);
        lastY = y;

        if (y < 130) {
          hidden = false;
          drift = 0;
        } else if (delta > 0) {
          drift = Math.max(0, drift) + delta;
          if (drift > 20) hidden = true;
        } else if (delta < 0) {
          drift = Math.min(0, drift) + delta;
          if (drift < -12) hidden = false;
        }

        header.classList.toggle("hidden", hidden);
      }
    };

    let frame = 0;

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        update();
      });
    };

    const onMove = (event: MouseEvent) => {
      if (!cursor) return;

      cursor.style.transform = `translate(${event.clientX - 13}px,${
        event.clientY - 13
      }px)`;

      const under = document.elementFromPoint(event.clientX, event.clientY);
      cursor.classList.toggle(
        "near",
        Boolean(under?.closest("a, button, input, select"))
      );
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    document.addEventListener("visibilitychange", update);
    window.addEventListener("mousemove", onMove, { passive: true });

    update();

    return () => {
      if (frame) cancelAnimationFrame(frame);
      timers.forEach(clearTimeout);
      observer?.disconnect();
      mutations.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("mousemove", onMove);
    };
  }, [routeKey]);
}
