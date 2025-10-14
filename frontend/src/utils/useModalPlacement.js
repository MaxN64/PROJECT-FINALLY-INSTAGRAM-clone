import { useEffect, useMemo, useState } from "react";

const DEFAULT_STYLE = Object.freeze({
  backdrop: {},
  window: {},
});

const DESKTOP_STYLE = Object.freeze({
  backdrop: {
    justifyItems: "center",
    alignItems: "start",
    padding: "20px",
    clipPath: "polygon(31% 0%, 100% 0%, 100% 100%, 31% 100%)",
  },
  window: {
    marginLeft: "170px",
    marginTop: "20px",
  },
});

function computeStyle() {
  if (typeof window === "undefined") {
    return DEFAULT_STYLE;
  }
  return (window.innerWidth || 0) >= 1024 ? DESKTOP_STYLE : DEFAULT_STYLE;
}

export default function useModalPlacement() {
  const [styles, setStyles] = useState(() => computeStyle());

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handler = () => setStyles(computeStyle());
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return useMemo(() => styles, [styles]);
}