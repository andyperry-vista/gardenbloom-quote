import { useEffect } from "react";

/**
 * Sets per-route <title>, meta description, og:title, og:description, og:url
 * and canonical so non-homepage routes have unique heads for crawlers that
 * execute JS. Restores previous values on unmount.
 */
export function useDocumentHead(opts: {
  title: string;
  description?: string;
  path?: string;
  noindex?: boolean;
}) {
  const { title, description, path, noindex } = opts;

  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const ensure = (selector: string, create: () => HTMLElement) => {
      let el = document.head.querySelector<HTMLElement>(selector);
      let created = false;
      if (!el) {
        el = create();
        document.head.appendChild(el);
        created = true;
      }
      return { el, created };
    };

    const setMeta = (
      attr: "name" | "property",
      key: string,
      value: string,
    ) => {
      const sel = `meta[${attr}="${key}"]`;
      const { el, created } = ensure(sel, () => {
        const m = document.createElement("meta");
        m.setAttribute(attr, key);
        return m;
      });
      const prev = el.getAttribute("content");
      el.setAttribute("content", value);
      return () => {
        if (created) el.remove();
        else if (prev !== null) el.setAttribute("content", prev);
      };
    };

    const restorers: Array<() => void> = [];

    if (description) {
      restorers.push(setMeta("name", "description", description));
      restorers.push(setMeta("property", "og:description", description));
    }
    restorers.push(setMeta("property", "og:title", title));

    if (path) {
      const url = `https://mayuragardenservices.com.au${path}`;
      restorers.push(setMeta("property", "og:url", url));
      const linkSel = 'link[rel="canonical"]';
      const { el, created } = ensure(linkSel, () => {
        const l = document.createElement("link");
        l.setAttribute("rel", "canonical");
        return l;
      });
      const prev = el.getAttribute("href");
      el.setAttribute("href", url);
      restorers.push(() => {
        if (created) el.remove();
        else if (prev !== null) el.setAttribute("href", prev);
      });
    }

    if (noindex) {
      restorers.push(setMeta("name", "robots", "noindex, nofollow"));
    }

    return () => {
      document.title = prevTitle;
      restorers.forEach((fn) => fn());
    };
  }, [title, description, path, noindex]);
}
