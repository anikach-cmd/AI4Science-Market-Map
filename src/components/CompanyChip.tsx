import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Company } from "../types";
import { foundedYearBucket } from "../utils/foundedYear";
import { CompanyLogo } from "./CompanyLogo";

interface CompanyChipProps {
  company: Company;
  onEdit: (company: Company) => void;
  onDelete: (id: string) => void;
  onDragEnd?: (company: Company, clientX: number, clientY: number) => void;
  onDragStart?: () => void;
  query?: string;
  /** "map": draggable, sits in a plot cell's wrap grid. "grid": static, Grid view card. */
  variant?: "map" | "grid";
}

const DRAG_THRESHOLD = 5;

export function CompanyChip({
  company,
  onEdit,
  onDelete,
  onDragEnd,
  onDragStart,
  query,
  variant = "map",
}: CompanyChipProps) {
  const chipRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const closeTimer = useRef<number | null>(null);
  const dragState = useRef<{
    startX: number;
    startY: number;
    moved: boolean;
    pointerId: number;
  } | null>(null);

  const open = hovering || pinned;
  const bucket = foundedYearBucket(company.foundedYear);

  const matchState =
    !query || !query.trim()
      ? "neutral"
      : company.name.toLowerCase().includes(query.trim().toLowerCase())
      ? "match"
      : "dim";

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setHovering(false), 150);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (variant !== "map" || e.button !== 0) return;
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      pointerId: e.pointerId,
    };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    if (!ds.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      ds.moved = true;
      onDragStart?.();
    }
    if (ds.moved) {
      setDragPos({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const ds = dragState.current;
    dragState.current = null;
    if (!ds) return;
    if (ds.moved) {
      onDragEnd?.(company, e.clientX, e.clientY);
    } else {
      setPinned((p) => !p);
    }
    setDragPos(null);
  };

  useEffect(() => () => clearCloseTimer(), []);

  const style: React.CSSProperties = dragPos
    ? {
        position: "fixed",
        left: dragPos.x,
        top: dragPos.y,
        transform: "translate(-50%, -50%)",
        zIndex: 500,
      }
    : {};

  return (
    <>
      <div
        ref={chipRef}
        className={`company-chip${variant === "grid" ? " company-chip-grid" : ""}${
          dragPos ? " company-chip-dragging" : ""
        }${matchState === "dim" ? " company-chip-dim" : ""}${
          matchState === "match" ? " company-chip-match" : ""
        }`}
        style={style}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={(e) => {
          e.stopPropagation();
          if (variant === "grid") setPinned((p) => !p);
        }}
        onMouseEnter={() => {
          clearCloseTimer();
          setHovering(true);
        }}
        onMouseLeave={scheduleClose}
      >
        <CompanyLogo name={company.name} websiteUrl={company.websiteUrl} size={22} />
        <span className="company-chip-name">{company.name}</span>
        {bucket && (
          <span
            className="company-chip-dot"
            style={{ backgroundColor: bucket.color }}
            title={`Founded ${company.foundedYear}`}
          />
        )}
      </div>
      {open && !dragPos && (
        <CompanyPopover
          company={company}
          anchorEl={chipRef.current}
          pinned={pinned}
          onMouseEnter={clearCloseTimer}
          onMouseLeave={scheduleClose}
          onClose={() => {
            setPinned(false);
            setHovering(false);
          }}
          onEdit={() => onEdit(company)}
          onDelete={() => onDelete(company.id)}
        />
      )}
    </>
  );
}

interface CompanyPopoverProps {
  company: Company;
  anchorEl: HTMLElement | null;
  pinned: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function CompanyPopover({
  company,
  anchorEl,
  pinned,
  onMouseEnter,
  onMouseLeave,
  onClose,
  onEdit,
  onDelete,
}: CompanyPopoverProps) {
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const popWidth = 300;
    const popHeight = 220;
    const margin = 12;

    let left = rect.left + rect.width / 2 - popWidth / 2;
    let top = rect.bottom + 8;

    if (left < margin) left = margin;
    if (left + popWidth > window.innerWidth - margin) {
      left = window.innerWidth - margin - popWidth;
    }
    if (top + popHeight > window.innerHeight - margin) {
      top = rect.top - popHeight - 8;
      if (top < margin) top = margin;
    }
    setCoords({ left, top });
  }, [anchorEl]);

  const websiteHref = /^https?:\/\//i.test(company.websiteUrl)
    ? company.websiteUrl
    : `https://${company.websiteUrl}`;

  if (!coords) return null;

  return createPortal(
    <div
      ref={popRef}
      className="company-popover"
      style={{ left: coords.left, top: coords.top, width: 300 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="company-popover-header">
        <CompanyLogo name={company.name} websiteUrl={company.websiteUrl} size={26} />
        <span className="company-popover-name">{company.name}</span>
        {pinned && (
          <button className="popover-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        )}
      </div>
      {company.tag && <span className="company-popover-tag">{company.tag}</span>}
      <p className="company-popover-desc">{company.description}</p>
      {company.rationale && (
        <p className="company-popover-rationale">
          <strong>Why here:</strong> {company.rationale}
        </p>
      )}
      <a
        className="company-popover-link"
        href={websiteHref}
        target="_blank"
        rel="noreferrer"
      >
        Visit website ↗
      </a>
      <div className="company-popover-actions">
        <button className="btn btn-ghost btn-sm" onClick={onEdit}>
          Edit
        </button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>,
    document.body
  );
}
