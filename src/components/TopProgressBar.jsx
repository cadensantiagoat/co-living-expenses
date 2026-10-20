import { useEffect, useState } from "react";

// Thin YouTube-style bar at the top of the window while work is running.
// Waits 150ms before showing so fast requests never flash it.
function TopProgressBar({ active }) {
  const [phase, setPhase] = useState("idle");

  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => setPhase("running"), 150);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => setPhase((current) => (current === "running" ? "done" : current)), 0);
    return () => clearTimeout(timer);
  }, [active]);

  useEffect(() => {
    if (phase !== "done") return;
    const timer = setTimeout(() => setPhase("idle"), 500);
    return () => clearTimeout(timer);
  }, [phase]);

  return <div className={`top-progress top-progress-${phase}`} aria-hidden="true" />;
}

export default TopProgressBar;
