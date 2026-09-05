import { cn } from "@/lib/utils";
import { Box, Inline } from "@/components/ui/Layout";

// ---------------------------------------------------------------------------
// Pagination — điều hướng trang danh sách.
// ---------------------------------------------------------------------------

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <Box>
      <Inline justify="center" gap="sm" className="mt-6">
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              "h-9 w-9 cursor-pointer rounded-lg text-sm font-medium transition",
              p === page
                ? "bg-white text-black"
                : "border border-white/10 bg-white/5 text-gray-400 hover:bg-white/10",
            )}
          >
            {p}
          </button>
        ))}
      </Inline>
    </Box>
  );
}
