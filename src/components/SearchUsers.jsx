import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon";

export default function SearchUsers({ onOpenChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    onOpenChange?.(false);
  }, [onOpenChange]);

  const openSearch = () => {
    setOpen(true);
    onOpenChange?.(true);
  };

  const submit = (e) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    close();
    navigate(`/search?q=${encodeURIComponent(term)}`);
  };

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const onClick = (e) => { if (!containerRef.current?.contains(e.target)) close(); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!open) {
    return (
      <button
        onClick={openSearch}
        className="p-2 rounded-md text-muted hover:text-white hover:bg-card-hover transition-colors cursor-pointer"
        aria-label="Search users"
      >
        <Icon name="search" className="w-[18px] h-[18px]" />
      </button>
    );
  }

  return (
    <form ref={containerRef} onSubmit={submit} role="search" className="w-52 sm:w-64 animate-[fade-in_150ms_ease]">
      <label className="flex items-center gap-2 rounded-md border border-line-strong bg-card px-3 py-1.5 focus-within:border-f1-red transition-colors">
        <Icon name="search" className="w-4 h-4 text-subtle" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users…"
          aria-label="Search users"
          className="bg-transparent text-sm text-white placeholder:text-subtle outline-none w-full [&::-webkit-search-cancel-button]:hidden"
        />
        <button type="button" onClick={close} aria-label="Close search" className="text-subtle hover:text-white transition-colors cursor-pointer">
          <Icon name="x" className="w-4 h-4" />
        </button>
      </label>
    </form>
  );
}
