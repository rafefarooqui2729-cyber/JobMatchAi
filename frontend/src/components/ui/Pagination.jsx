import Button from './Button.jsx';

export default function Pagination({
  page,
  pageCount,
  onPageChange,
  className = '',
}) {
  const safePageCount = Math.max(1, pageCount);
  const safePage = Math.min(
    safePageCount,
    Math.max(1, page),
  );

  return (
    <nav
      aria-label="Pagination"
      className={`
        flex
        flex-wrap
        items-center
        justify-between
        gap-3
        ${className}
      `}
    >
      <div
        className="
          rounded-xl
          border
          border-white/10
          bg-white/[0.045]
          px-3
          py-2
          backdrop-blur-xl
        "
      >
        <p className="text-sm text-slate-400">
          Page{' '}
          <span className="font-semibold text-white">
            {safePage}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-white">
            {safePageCount}
          </span>
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Previous
        </Button>

        <Button
          variant="secondary"
          size="sm"
          disabled={safePage >= safePageCount}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}