"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SearchResult = {
  projects: Array<{ id: string; name: string; code: string | null; status: string }>;
  customers: Array<{ id: string; name: string; companyName: string | null; email: string | null }>;
  quotations: Array<{ id: string; quotationNumber: string; note: string | null; status: string; customer: { name: string } }>;
  tasks: Array<{ id: string; title: string; status: string; project: { id: string; name: string; code: string | null } | null }>;
};

type FlatResult =
  | { type: "project"; data: SearchResult["projects"][number] }
  | { type: "customer"; data: SearchResult["customers"][number] }
  | { type: "quotation"; data: SearchResult["quotations"][number] }
  | { type: "task"; data: SearchResult["tasks"][number] };

type GlobalSearchProps = {
  orgSlug: string;
  locale: string;
};

const copy = {
  th: {
    placeholder: "ค้นหาโครงการ ลูกค้า ใบเสนอราคา หรือชื่องาน",
    empty: "ไม่พบผลลัพธ์สำหรับ",
    projectSection: "โครงการ",
    customerSection: "ลูกค้า",
    quotationSection: "ใบเสนอราคา",
    taskSection: "งาน",
    noProjectCode: "ไม่มีรหัสโครงการ",
    noExtraData: "ไม่มีข้อมูลเพิ่มเติม",
    noProjectLinked: "ไม่ได้ผูกกับโครงการ",
    navigate: "เลื่อนเลือก",
    select: "เปิดรายการ",
    close: "ปิด",
    projectStatuses: {
      PLANNING: "วางแผน",
      ACTIVE: "ใช้งาน",
      ON_HOLD: "พักงาน",
      COMPLETED: "เสร็จแล้ว",
      CANCELLED: "ยกเลิก",
    },
    quotationStatuses: {
      DRAFT: "ร่าง",
      SENT: "ส่งแล้ว",
      ACCEPTED: "อนุมัติแล้ว",
      REJECTED: "ปฏิเสธ",
      EXPIRED: "หมดอายุ",
    },
    taskStatuses: {
      TODO: "ต้องทำ",
      IN_PROGRESS: "กำลังทำ",
      BLOCKED: "ติดบล็อก",
      DONE: "เสร็จแล้ว",
      CANCELLED: "ยกเลิก",
    },
  },
  en: {
    placeholder: "Search projects, customers, quotations, or tasks",
    empty: "No results found for",
    projectSection: "Projects",
    customerSection: "Customers",
    quotationSection: "Quotations",
    taskSection: "Tasks",
    noProjectCode: "No project code",
    noExtraData: "No additional details",
    noProjectLinked: "Not linked to a project",
    navigate: "Navigate",
    select: "Open",
    close: "Close",
    projectStatuses: {
      PLANNING: "Planning",
      ACTIVE: "Active",
      ON_HOLD: "On hold",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    },
    quotationStatuses: {
      DRAFT: "Draft",
      SENT: "Sent",
      ACCEPTED: "Accepted",
      REJECTED: "Rejected",
      EXPIRED: "Expired",
    },
    taskStatuses: {
      TODO: "To do",
      IN_PROGRESS: "In progress",
      BLOCKED: "Blocked",
      DONE: "Done",
      CANCELLED: "Cancelled",
    },
  },
} as const;

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PLANNING: "bg-slate-100 text-slate-700",
    ACTIVE: "bg-emerald-100 text-emerald-700",
    ON_HOLD: "bg-amber-100 text-amber-700",
    COMPLETED: "bg-blue-100 text-blue-700",
    CANCELLED: "bg-red-100 text-red-700",
    DRAFT: "bg-slate-100 text-slate-700",
    SENT: "bg-blue-100 text-blue-700",
    ACCEPTED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
    EXPIRED: "bg-amber-100 text-amber-700",
    TODO: "bg-slate-100 text-slate-700",
    IN_PROGRESS: "bg-blue-100 text-blue-700",
    BLOCKED: "bg-amber-100 text-amber-700",
    DONE: "bg-emerald-100 text-emerald-700",
  };

  return colors[status] || "bg-slate-100 text-slate-700";
}

function getResultLink(type: FlatResult["type"], data: FlatResult["data"], locale: string, orgSlug: string) {
  switch (type) {
    case "project":
      return `/${locale}/org/${orgSlug}/projects/${data.id}`;
    case "customer":
      return `/${locale}/org/${orgSlug}/customers/${data.id}`;
    case "quotation":
      return `/${locale}/org/${orgSlug}/quotations/${data.id}`;
    case "task": {
      const task = data as SearchResult["tasks"][number];
      return task.project?.id ? `/${locale}/org/${orgSlug}/projects/${task.project.id}/tasks` : "#";
    }
  }
}

export function GlobalSearch({ orgSlug, locale }: GlobalSearchProps) {
  const router = useRouter();
  const ui = locale === "th" ? copy.th : copy.en;
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flatResults = useMemo<FlatResult[]>(
    () =>
      results
        ? [
            ...results.projects.map((project) => ({ type: "project" as const, data: project })),
            ...results.customers.map((customer) => ({ type: "customer" as const, data: customer })),
            ...results.quotations.map((quotation) => ({ type: "quotation" as const, data: quotation })),
            ...results.tasks.map((task) => ({ type: "task" as const, data: task })),
          ]
        : [],
    [results],
  );

  const openSearch = useCallback(() => {
    setQuery("");
    setResults(null);
    setSelectedIndex(-1);
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (isOpen) {
          closeSearch();
        } else {
          openSearch();
        }
      }

      if (event.key === "Escape" && isOpen) {
        closeSearch();
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [closeSearch, isOpen, openSearch]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeout = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        closeSearch();
      }
    };

    if (!isOpen) {
      return;
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeSearch, isOpen]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults(null);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/org/${orgSlug}/search?q=${encodeURIComponent(searchQuery)}`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = (await response.json()) as SearchResult;
          setResults(data);
        }
      } catch (error) {
        console.error("Global search failed:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [orgSlug],
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      void performSearch(value);
    }, 300);
  };

  const openSelectedResult = (result: FlatResult) => {
    const href = getResultLink(result.type, result.data, locale, orgSlug);
    if (href !== "#") {
      closeSearch();
      router.push(href);
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatResults.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
      return;
    }

    if (event.key === "Enter" && selectedIndex >= 0) {
      event.preventDefault();
      const result = flatResults[selectedIndex];
      if (result) {
        openSelectedResult(result);
      }
    }
  };

  const getStatusLabel = (type: FlatResult["type"], status: string) => {
    if (type === "project") {
      return ui.projectStatuses[status as keyof typeof ui.projectStatuses] ?? status;
    }

    if (type === "quotation") {
      return ui.quotationStatuses[status as keyof typeof ui.quotationStatuses] ?? status;
    }

    if (type === "task") {
      return ui.taskStatuses[status as keyof typeof ui.taskStatuses] ?? status;
    }

    return status;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[10vh]">
      <div
        ref={overlayRef}
        className="w-full max-w-2xl rounded-xl border bg-[var(--surface)] shadow-2xl"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center border-b px-4" style={{ borderColor: "var(--border)" }}>
          <svg className="h-5 w-5 shrink-0 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder={ui.placeholder}
            className="w-full bg-transparent px-4 py-4 text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
          />
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
          ) : null}
          <kbd
            className="hidden shrink-0 rounded border px-2 py-1 text-xs sm:inline"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            ESC
          </kbd>
        </div>

        {results ? (
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {flatResults.length === 0 && query && !isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">
                {ui.empty} &quot;{query}&quot;
              </div>
            ) : null}

            {results.projects.length > 0 ? (
              <div className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  {ui.projectSection}
                </div>
                {results.projects.map((project) => {
                  const globalIndex = flatResults.findIndex((result) => result.type === "project" && result.data.id === project.id);
                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => openSelectedResult({ type: "project", data: project })}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition ${
                        selectedIndex === globalIndex ? "bg-[var(--primary)]/10" : "hover:bg-[var(--background)]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-[var(--foreground)]">{project.name}</div>
                        <div className="truncate text-sm text-[var(--muted)]">{project.code || ui.noProjectCode}</div>
                      </div>
                      <span className={`ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(project.status)}`}>
                        {getStatusLabel("project", project.status)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {results.customers.length > 0 ? (
              <div className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  {ui.customerSection}
                </div>
                {results.customers.map((customer) => {
                  const globalIndex = flatResults.findIndex((result) => result.type === "customer" && result.data.id === customer.id);
                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => openSelectedResult({ type: "customer", data: customer })}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition ${
                        selectedIndex === globalIndex ? "bg-[var(--primary)]/10" : "hover:bg-[var(--background)]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-[var(--foreground)]">{customer.name}</div>
                        <div className="truncate text-sm text-[var(--muted)]">
                          {customer.companyName || customer.email || ui.noExtraData}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {results.quotations.length > 0 ? (
              <div className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  {ui.quotationSection}
                </div>
                {results.quotations.map((quotation) => {
                  const globalIndex = flatResults.findIndex((result) => result.type === "quotation" && result.data.id === quotation.id);
                  return (
                    <button
                      key={quotation.id}
                      type="button"
                      onClick={() => openSelectedResult({ type: "quotation", data: quotation })}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition ${
                        selectedIndex === globalIndex ? "bg-[var(--primary)]/10" : "hover:bg-[var(--background)]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-[var(--foreground)]">{quotation.quotationNumber}</div>
                        <div className="truncate text-sm text-[var(--muted)]">
                          {quotation.customer.name}
                          {quotation.note ? ` - ${quotation.note.slice(0, 50)}` : ""}
                        </div>
                      </div>
                      <span className={`ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(quotation.status)}`}>
                        {getStatusLabel("quotation", quotation.status)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {results.tasks.length > 0 ? (
              <div className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                  {ui.taskSection}
                </div>
                {results.tasks.map((task) => {
                  const globalIndex = flatResults.findIndex((result) => result.type === "task" && result.data.id === task.id);
                  return (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => openSelectedResult({ type: "task", data: task })}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition ${
                        selectedIndex === globalIndex ? "bg-[var(--primary)]/10" : "hover:bg-[var(--background)]"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium text-[var(--foreground)]">{task.title}</div>
                        <div className="truncate text-sm text-[var(--muted)]">
                          {task.project ? `${task.project.name} (${task.project.code || ui.noProjectCode})` : ui.noProjectLinked}
                        </div>
                      </div>
                      <span className={`ml-2 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(task.status)}`}>
                        {getStatusLabel("task", task.status)}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}

        <div
          className="flex items-center justify-between border-t px-4 py-2 text-xs"
          style={{ borderColor: "var(--border)", color: "var(--muted)" }}
        >
          <div className="flex items-center gap-2">
            <kbd className="rounded border px-1.5 py-0.5" style={{ borderColor: "var(--border)" }}>
              ↑↓
            </kbd>
            <span>{ui.navigate}</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded border px-1.5 py-0.5" style={{ borderColor: "var(--border)" }}>
              Enter
            </kbd>
            <span>{ui.select}</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="rounded border px-1.5 py-0.5" style={{ borderColor: "var(--border)" }}>
              Esc
            </kbd>
            <span>{ui.close}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
