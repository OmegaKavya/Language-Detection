import { useEffect, useRef, useState } from "react";

// Reveal on scroll, falling open immediately where IntersectionObserver is
// missing, because a panel that never reveals is a blank page.
export default function useReveal() {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") { setShown(true); return undefined; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setShown(true); io.disconnect(); }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return [ref, shown ? "reveal shown" : "reveal"];
}
