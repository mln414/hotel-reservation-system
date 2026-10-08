import { ChevronLeft, ChevronRight } from "lucide-react";

import "./HotelPagination.css";

function createPageRange(currentPage, totalPages, siblingCount) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const firstSibling = Math.max(2, currentPage - siblingCount);
  const lastSibling = Math.min(totalPages - 1, currentPage + siblingCount);
  const pages = [1];

  if (firstSibling > 2) pages.push("start-ellipsis");

  for (let page = firstSibling; page <= lastSibling; page += 1) {
    pages.push(page);
  }

  if (lastSibling < totalPages - 1) pages.push("end-ellipsis");

  pages.push(totalPages);
  return pages;
}

function HotelPagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}) {
  if (totalPages <= 1) return null;

  const pages = createPageRange(currentPage, totalPages, siblingCount);

  return (
    <nav className="hotel-pagination" aria-label="Hotel results pagination">
      <button
        aria-label="Previous page"
        className="hotel-pagination-button hotel-pagination-arrow"
        disabled={currentPage === 1}
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      >
        <ChevronLeft aria-hidden="true" size={18} />
      </button>

      <div className="hotel-pagination-pages">
        {pages.map((page) =>
          typeof page === "number" ? (
            <button
              aria-current={currentPage === page ? "page" : undefined}
              aria-label={`Page ${page}`}
              className={`hotel-pagination-button${
                currentPage === page ? " hotel-pagination-button--active" : ""
              }`}
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ) : (
            <span className="hotel-pagination-ellipsis" key={page} aria-hidden="true">
              …
            </span>
          ),
        )}
      </div>

      <button
        aria-label="Next page"
        className="hotel-pagination-button hotel-pagination-arrow"
        disabled={currentPage === totalPages}
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
      >
        <ChevronRight aria-hidden="true" size={18} />
      </button>
    </nav>
  );
}

export default HotelPagination;
