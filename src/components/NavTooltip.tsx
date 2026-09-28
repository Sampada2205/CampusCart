"use client";

import { useRef } from "react";
import Link from "next/link";

export type NavTooltipItem = {
  icon: React.ReactNode;
  tooltip: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

type Props = {
  id: string;
  items: NavTooltipItem[];
};

export default function NavTooltip({ id, items }: Props) {
  const group = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const text = useRef<HTMLSpanElement>(null);

  function hide() {
    if (!tip.current) return;
    tip.current.setAttribute("data-show", "false");
    tip.current.setAttribute("aria-hidden", "true");
  }

  function place(trigger: HTMLElement, label: string) {
    const t = tip.current;
    const g = group.current;
    const tx = text.current;
    if (!t || !g || !tx) return;

    const showing = t.getAttribute("data-show") === "true";
    tx.textContent = label;

    const cs = getComputedStyle(t);
    const width = Math.ceil(
      tx.scrollWidth +
        parseFloat(cs.paddingLeft) +
        parseFloat(cs.paddingRight)
    );

    const gRect = g.getBoundingClientRect();
    const rRect = trigger.getBoundingClientRect();
    const x = rRect.left - gRect.left + rRect.width / 2 - width / 2;

    if (!showing) {
      t.style.transition = "none";
      t.style.width = `${width}px`;
      t.style.setProperty("--tt-x", `${x}px`);
      void t.offsetWidth;
      t.style.transition = "";
    } else {
      t.style.width = `${width}px`;
      t.style.setProperty("--tt-x", `${x}px`);
    }

    t.setAttribute("data-show", "true");
    t.setAttribute("aria-hidden", "false");
  }

  return (
    <span ref={group} className="t-tt-group" onPointerLeave={hide}>
      {items.map((item, i) => {
        const commonProps = {
          className: "tt-icon-btn",
          "aria-describedby": id,
          "aria-label": item.tooltip,
          onPointerEnter: (e: React.PointerEvent<HTMLElement>) =>
            place(e.currentTarget, item.tooltip),
          onFocus: (e: React.FocusEvent<HTMLElement>) =>
            place(e.currentTarget, item.tooltip),
          onBlur: hide,
        };

        if (item.href) {
          return (
            <Link key={i} href={item.href} {...commonProps}>
              {item.icon}
            </Link>
          );
        }

        return (
          <button
            key={i}
            type="button"
            onClick={item.onClick}
            disabled={item.disabled}
            {...commonProps}
          >
            {item.icon}
          </button>
        );
      })}

      <span
        ref={tip}
        id={id}
        className="t-tt"
        role="tooltip"
        aria-hidden="true"
        data-show="false"
      >
        <span ref={text} className="t-tt-text" />
      </span>
    </span>
  );
}