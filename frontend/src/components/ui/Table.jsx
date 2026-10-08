export default function Table({
  columns = [],
  rows = [],
  rowKey = 'id',
  caption,
  emptyMessage = 'No records to display.',
  className = '',
}) {
  return (
    <div
      className={`
        relative
        overflow-hidden
        overflow-x-auto
        rounded-2xl
        border
        border-white/[0.09]
        bg-white/[0.045]
        shadow-[0_18px_60px_rgba(0,0,0,0.20)]
        backdrop-blur-2xl
        ${className}
      `}
    >
      {/* Top glass highlight */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          z-20
          h-px
          bg-gradient-to-r
          from-transparent
          via-white/[0.18]
          to-transparent
        "
      />

      {/* Subtle ambient glow */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-20
          top-[-5rem]
          h-40
          w-40
          rounded-full
          bg-cyan-400/[0.035]
          blur-3xl
        "
      />

      <table className="relative w-full min-w-[36rem] border-collapse text-left text-sm">
        {caption && (
          <caption className="sr-only">
            {caption}
          </caption>
        )}

        {/* =====================================================
            TABLE HEADER
        ====================================================== */}
        <thead className="border-b border-white/[0.09] bg-white/[0.055]">
          <tr>
            {columns.map((column) => (
              <th
                scope="col"
                key={column.key}
                className="
                  whitespace-nowrap
                  px-4
                  py-3.5
                  text-[11px]
                  font-bold
                  uppercase
                  tracking-[0.12em]
                  text-slate-300
                "
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* =====================================================
            TABLE BODY
        ====================================================== */}
        <tbody className="divide-y divide-white/[0.07]">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length || 1}
                className="
                  px-4
                  py-14
                  text-center
                  text-sm
                  text-slate-400
                "
              >
                <div className="mx-auto flex max-w-sm flex-col items-center">
                  {/* Empty-state icon */}
                  <div
                    className="
                      mb-4
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-2xl
                      border
                      border-white/[0.09]
                      bg-white/[0.055]
                      text-slate-400
                      shadow-[0_10px_30px_rgba(0,0,0,0.15)]
                      backdrop-blur-xl
                    "
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5"
                    >
                      <path
                        d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />

                      <path
                        d="M8 9h8M8 12h8M8 15h5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <p className="font-medium text-slate-300">
                    {emptyMessage}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Records will appear here when available.
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={row[rowKey] ?? index}
                className="
                  group
                  relative
                  transition-all
                  duration-200
                  hover:bg-white/[0.055]
                "
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="
                      px-4
                      py-3.5
                      text-slate-300
                      transition-colors
                      duration-200
                      group-hover:text-slate-100
                    "
                  >
                    {column.render
                      ? column.render(row[column.key], row)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}