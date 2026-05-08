import { ReactNode, useRef, useState, TouchEvent } from "react";
import { Loader2, ArrowDown } from "lucide-react";

interface Props {
  onRefresh: () => Promise<unknown> | unknown;
  children: ReactNode;
  threshold?: number;
}

/**
 * Lightweight pull-to-refresh wrapper for mobile.
 * Only triggers when the page is scrolled to the top and the user pulls down.
 */
export function PullToRefresh({ onRefresh, children, threshold = 70 }: Props) {
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = (e: TouchEvent) => {
    if (window.scrollY > 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPull(Math.min(dy * 0.5, threshold * 1.5));
  };

  const onTouchEnd = async () => {
    if (startY.current == null) return;
    const shouldRefresh = pull >= threshold;
    startY.current = null;
    if (shouldRefresh) {
      setRefreshing(true);
      setPull(threshold);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  const ready = pull >= threshold;

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="flex items-center justify-center overflow-hidden text-muted-foreground transition-[height] duration-150"
        style={{ height: pull }}
        aria-hidden={pull === 0}
      >
        {refreshing ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <ArrowDown
              className={`w-4 h-4 transition-transform ${ready ? "rotate-180" : ""}`}
            />
            {ready ? "Release to refresh" : "Pull to refresh"}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
