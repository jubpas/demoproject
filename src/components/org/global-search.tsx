"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type SearchResult = {
  projects: Array<{ id: string; name: string; code: string | null; status: string }>;
  customers: Array<{ id: string; name: string; companyName: string | null; email: string | null }>;
  quotations: Array<{ id: string; quotationNumber: string; note: string | null; status: string; customer: { name: string } }>;
  tasks: Array<{ id: string; title: string; status: string; project: { id: string; name: string; code: string | null } | null }>;
};

type GlobalSearchProps = {
  orgSlug: string;
  locale: string;
};

export function GlobalSearch({ orgSlug, locale }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flatten results for keyboard navigation
  const flatResults = results
    ? [
        ...results.projects.map((p) => ({ type: "project" as const, data: p })),
        ...results.customers.map((c) => ({ type: "customer" as const, data: c })),
        ...results.quotations.map((q) => ({ type: "quotation" as const, data: q })),
        ...results.tasks.map((t) => ({ type: "task" as const, data: t })),
      ]
    : [];

  // Keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setResults(null);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Debounced search
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults(null);
        return;
      }

      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/org/${orgSlug}/search?q=${encodeURIComponent(searchQuery)}`,
          { credentials: "include" }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [orgSlug]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Keyboard navigation for results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      const result = flatResults[selectedIndex];
      if (result) {
        window.location.href = getResultLink(result.type, result.data, locale, orgSlug);
      }
    }
  };

  const getResultLink = (
    type: string,
    data: Record<string, unknown>,
    locale: string,
    orgSlug: string
  ): string => {
    switch (type) {
      case "project":
        return `/${locale}/org/${orgSlug}/projects/${(data as { id: string }).id}`;
      case "customer":
        return `/${locale}/org/${orgSlug}/customers/${(data as { id: string }).id}`;
      case "quotation":
        return `/${locale}/org/${orgSlug}/quotations/${(data as { id: string }).id}`;
      case "task":
        // Tasks are nested under projects in this app
        const taskData = data as { id: string; project?: { id: string } };
        if (taskData.project?.id) {
          return `/${locale}/org/${orgSlug}/projects/${taskData.project.id}/tasks/${(data as { id: string }).id}`;
        }
        return "#";
      default:
        return "#";
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      COMPLETED: "bg-blue-100 text-blue-800",
      DRAFT: "bg-gray-100 text-gray-800",
      SENT: "bg-yellow-100 text-yellow-800",
      ACCEPTED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      TODO: "bg-slate-100 text-slate-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      DONE: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[10vh]">
      <div ref={overlayRef} className="w-full max-w-2xl rounded-xl border bg-[var(--surface)] shadow-2xl" style={{ borderColor: "var(--border)" }}>
        {/* Search Input */}
        <div className="flex items-center border-b px-4" style={{ borderColor: "var(--border)" }}>
          <svg className="h-5 w-5 shrink-0 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="ค้นหาโครงการ, ลูกค้า, ใบเสนอราคา, งาน..."
            className="w-full bg-transparent px-4 py-4 text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
          />
          {isLoading && (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          )}
          <kbd className="hidden shrink-0 rounded border px-2 py-1 text-xs sm:inline" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        {results && (
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {flatResults.length === 0 && query && !isLoading && (
              <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">
                ไม่พบผลลัพธ์สำหรับ &quot;{query}&quot;
              </div>
            )}

            {/* Projects */}
            {results.projects.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  โครงการ
                </div>
                {results.projects.map((project, idx) => {
                  const globalIdx = flatResults.findIndex(
                    (r) => r.type === "project" && r.data.id === project.id
                  );
                  return (
                    <a
                      key={project.id}
                      href={`/${locale}/org/${orgSlug}/projects/${project.id}`}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition ${
                        selectedIndex === globalIdx
                          ? "bg-[var(--primary)]/10"
                          : "hover:bg-[var(--background)]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-[var(--foreground)]">{project.name}</div>
                        <div className="truncate text-sm text-[var(--muted)]">
                          {project.code || "ไม่มีรหัส"}
                        </div>
                      </div>
                      <span className={`ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </a>
                  );
                })}
              </div>
            )}

            {/* Customers */}
            {results.customers.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  ลูกค้า
                </div>
                {results.customers.map((customer) => {
                  const globalIdx = flatResults.findIndex(
                    (r) => r.type === "customer" && r.data.id === customer.id
                  );
                  return (
                    <a
                      key={customer.id}
                      href={`/${locale}/org/${orgSlug}/customers/${customer.id}`}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition ${
                        selectedIndex === globalIdx
                          ? "bg-[var(--primary)]/10"
                          : "hover:bg-[var(--background)]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-[var(--foreground)]">{customer.name}</div>
                        <div className="truncate text-sm text-[var(--muted)]">
                          {customer.companyName || customer.email || "ไม่มีข้อมูลเพิ่มเติม"}
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}

            {/* Quotations */}
            {results.quotations.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  ใบเสนอราคา
                </div>
                {results.quotations.map((quotation) => {
                  const globalIdx = flatResults.findIndex(
                    (r) => r.type === "quotation" && r.data.id === quotation.id
                  );
                  return (
                    <a
                      key={quotation.id}
                      href={`/${locale}/org/${orgSlug}/quotations/${quotation.id}`}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition ${
                        selectedIndex === globalIdx
                          ? "bg-[var(--primary)]/10"
                          : "hover:bg-[var(--background)]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-[var(--foreground)]">
                          {quotation.quotationNumber}
                        </div>
                        <div className="truncate text-sm text-[var(--muted)]">
                          {quotation.customer.name} {quotation.note ? `- ${quotation.note.slice(0, 50)}` : ""}
                        </div>
                      </div>
                      <span className={`ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(quotation.status)}`}>
                        {quotation.status}
                      </span>
                    </a>
                  );
                })}
              </div>
            )}

            {/* Tasks */}
            {results.tasks.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  งาน
                </div>
                {results.tasks.map((task) => {
                  const globalIdx = flatResults.findIndex(
                    (r) => r.type === "task" && r.data.id === task.id
                  );
                  const link = getResultLink("task", task as unknown as Record<string, unknown>, locale, orgSlug);
                  return (
                    <a
                      key={task.id}
                      href={link}
                      className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition ${
                        selectedIndex === globalIdx
                          ? "bg-[var(--primary)]/10"
                          : "hover:bg-[var(--background)]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-[var(--foreground)]">{task.title}</div>
                        <div className="truncate text-sm text-[var(--muted)]">
                          {task.project ? `${task.project.name} (${task.project.code || "N/A"})` : "ไม่มีโครงการ"}
                        </div>
                      </div>
                      <span className={`ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-2 text-xs" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
          <div className="flex items-center gap-2">
            <kbd className="rounded border px-1.5 py-0.5" style={{ borderColor: "var(--border)" }}>
              ↑↓
            </kbd>
            <span>นำทาง</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded border px-1.5 py-0.5" style={{ borderColor: "var(--border)" }}>
              Enter
            </kbd>
            <span>เลือก</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded border px-1.5 py-0.5" style={{ borderColor: "var(--border)" }}>
              Esc
            </kbd>
            <span>ปิด</span>
          </div>
        </div>
      </div>
    </div>
  );
}
