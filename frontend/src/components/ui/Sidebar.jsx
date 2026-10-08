import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { motionVariants } from '../../design-system/motion.js';

function SidebarContent({ items, onNavigate, title }) {
  return (
    <nav
      aria-label={title}
      className="flex h-full flex-col p-3"
    >
      {/* Section title */}
      <p
        className="
          px-3
          pb-3
          pt-2
          text-[10px]
          font-bold
          uppercase
          tracking-[0.18em]
          text-slate-500
        "
      >
        {title}
      </p>

      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) => `
                group
                relative
                flex
                min-h-11
                items-center
                gap-3
                overflow-hidden
                rounded-xl
                border
                px-3
                text-sm
                font-medium
                outline-none
                transition-all
                duration-200

                focus-visible:ring-4
                focus-visible:ring-cyan-400/20

                ${
                  isActive
                    ? `
                      border-cyan-300/20
                      bg-gradient-to-r
                      from-cyan-400/[0.15]
                      via-blue-500/[0.10]
                      to-white/[0.045]
                      text-white
                      shadow-[0_8px_28px_rgba(8,15,35,0.24)]
                      backdrop-blur-xl
                    `
                    : `
                      border-transparent
                      bg-transparent
                      text-slate-400
                      hover:border-white/[0.08]
                      hover:bg-white/[0.055]
                      hover:text-slate-100
                    `
                }
              `}
            >
              {/* Active indicator */}
              <span
                aria-hidden="true"
                className="
                  absolute
                  bottom-2
                  left-0
                  top-2
                  w-0.5
                  rounded-r-full
                  bg-cyan-300
                  opacity-0
                  shadow-[0_0_12px_rgba(103,232,249,0.85)]
                  transition-opacity
                  duration-200
                  group-[.active]:opacity-100
                "
              />

              {/* Icon */}
              {item.icon && (
                <span
                  aria-hidden="true"
                  className="
                    relative
                    grid
                    h-8
                    w-8
                    shrink-0
                    place-items-center
                    rounded-lg
                    border
                    border-white/[0.06]
                    bg-white/[0.025]
                    text-sm
                    text-slate-400
                    transition-all
                    duration-200
                    group-hover:border-cyan-300/10
                    group-hover:bg-cyan-300/[0.06]
                    group-hover:text-cyan-300
                  "
                >
                  {item.icon}
                </span>
              )}

              {/* Label */}
              <span className="min-w-0 flex-1 truncate">
                {item.label}
              </span>

              {/* Badge */}
              {item.badge != null && (
                <span
                  className="
                    shrink-0
                    rounded-full
                    border
                    border-cyan-300/15
                    bg-cyan-300/[0.08]
                    px-2
                    py-0.5
                    text-[10px]
                    font-bold
                    tabular-nums
                    text-cyan-200
                    shadow-[0_0_14px_rgba(34,211,238,0.08)]
                    backdrop-blur-sm
                  "
                >
                  {item.badge}
                </span>
              )}

              {/* Hover highlight */}
              <span
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  inset-x-3
                  bottom-0
                  h-px
                  bg-gradient-to-r
                  from-transparent
                  via-white/[0.12]
                  to-transparent
                  opacity-0
                  transition-opacity
                  duration-200
                  group-hover:opacity-100
                "
              />
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Sidebar({
  items = [],
  title = 'Workspace',
  open = false,
  onClose,
  className = '',
}) {
  const closeButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const previouslyFocused = useRef(null);
  const onCloseRef = useRef(onClose);

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;

    previouslyFocused.current = document.activeElement;
    closeButtonRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = drawerRef.current?.querySelectorAll(
        'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
      );

      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  return (
    <>
      {/* =========================================================
          DESKTOP SIDEBAR
      ========================================================= */}
      <aside
        className={`
          relative
          hidden
          w-64
          shrink-0
          overflow-hidden
          border-r
          border-white/[0.08]
          bg-[#07101f]/70
          shadow-[12px_0_50px_rgba(0,0,0,0.10)]
          backdrop-blur-2xl
          lg:block
          ${className}
        `}
      >
        {/* Ambient glow */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -left-16
            top-24
            h-48
            w-48
            rounded-full
            bg-cyan-400/[0.06]
            blur-3xl
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            bottom-20
            right-[-5rem]
            h-40
            w-40
            rounded-full
            bg-blue-500/[0.045]
            blur-3xl
          "
        />

        <div className="relative h-full">
          {/* Top glass highlight */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-x-0
              top-0
              z-10
              h-px
              bg-gradient-to-r
              from-transparent
              via-cyan-300/25
              to-transparent
            "
          />

          {/* Right edge highlight */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              bottom-0
              right-0
              top-0
              w-px
              bg-gradient-to-b
              from-transparent
              via-white/[0.06]
              to-transparent
            "
          />

          <SidebarContent
            items={items}
            title={title}
          />
        </div>
      </aside>

      {/* =========================================================
          MOBILE DRAWER
      ========================================================= */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="
              fixed
              inset-0
              z-50
              bg-[#020617]/70
              backdrop-blur-md
              lg:hidden
            "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                onClose?.();
              }
            }}
          >
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={`${title} navigation`}
              ref={drawerRef}
              variants={motionVariants.sidebar}
              initial="closed"
              animate="open"
              exit="closed"
              className="
                relative
                h-full
                w-[min(19rem,86vw)]
                overflow-hidden
                border-r
                border-white/[0.10]
                bg-[#07101f]/95
                shadow-[20px_0_70px_rgba(0,0,0,0.48)]
                backdrop-blur-2xl
              "
            >
              {/* Ambient glow */}
              <div
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  -left-20
                  top-16
                  h-56
                  w-56
                  rounded-full
                  bg-cyan-400/[0.08]
                  blur-3xl
                "
              />

              <div
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  bottom-[-5rem]
                  right-[-5rem]
                  h-48
                  w-48
                  rounded-full
                  bg-blue-500/[0.06]
                  blur-3xl
                "
              />

              {/* Top highlight */}
              <div
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  inset-x-0
                  top-0
                  z-10
                  h-px
                  bg-gradient-to-r
                  from-transparent
                  via-cyan-300/30
                  to-transparent
                "
              />

              {/* Header */}
              <div
                className="
                  relative
                  flex
                  h-16
                  items-center
                  justify-between
                  border-b
                  border-white/[0.08]
                  bg-white/[0.025]
                  px-4
                  backdrop-blur-xl
                "
              >
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="
                      h-2
                      w-2
                      rounded-full
                      bg-cyan-300
                      shadow-[0_0_14px_rgba(103,232,249,0.85)]
                    "
                  />

                  <span className="text-sm font-semibold text-white">
                    {title}
                  </span>
                </div>

                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Close navigation"
                  onClick={onClose}
                  className="
                    grid
                    h-9
                    w-9
                    place-items-center
                    rounded-xl
                    border
                    border-white/[0.08]
                    bg-white/[0.045]
                    text-xl
                    leading-none
                    text-slate-400
                    shadow-[0_8px_20px_rgba(0,0,0,0.12)]
                    backdrop-blur-xl
                    transition-all
                    duration-200
                    hover:-translate-y-0.5
                    hover:border-white/[0.14]
                    hover:bg-white/[0.08]
                    hover:text-white
                    focus-visible:outline-none
                    focus-visible:ring-4
                    focus-visible:ring-cyan-400/20
                  "
                >
                  ×
                </button>
              </div>

              {/* Navigation */}
              <div className="relative h-[calc(100%-4rem)]">
                <SidebarContent
                  items={items}
                  title={title}
                  onNavigate={onClose}
                />
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}