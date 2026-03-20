import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchUsers({ onOpenChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const close = () => {
    setOpen(false);
    setQuery("");
    onOpenChange?.(false);
  };

  const openSearch = () => {
    setOpen(true);
    onOpenChange?.(true);
  };

  const submit = () => {
    const term = query.trim();
    if (!term) return;
    close();
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  // Focus input when opening
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  if (!open) {
    return (
      <button
        onClick={openSearch}
        className="p-1.5 text-muted hover:text-white transition-colors cursor-pointer"
        aria-label="Rechercher des utilisateurs"
      >
        <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </button>
    );
  }

  return (
    <div ref={containerRef} className="relative w-64">
      <div className="flex items-center gap-2 rounded-lg border border-line bg-page px-3 py-1.5">
        <svg className="w-4 h-4 text-subtle shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="bg-transparent text-sm text-white outline-none w-full"
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <button
          onClick={close}
          className="text-subtle hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
