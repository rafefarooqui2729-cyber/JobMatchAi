import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from './Button.jsx';

export default function Navbar({
  brand = 'JobMatch AI',
  brandHref = '/',
  actions,
  onMenuClick,
  mobileMenuItems = [],
  className = '',
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className={[
        'sticky',
        'top-0',
        'z-30',
        'border-b',
        'border-white/10',
        'bg-slate-950/65',
        'backdrop-blur-2xl',
        'shadow-[0_12px_40px_-25px_rgba(0,0,0,0.9)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Soft ambient glow behind navbar */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent"
      />

      <div className="relative mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {/* Mobile menu button */}
          {mobileMenuItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="sm:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={
                mobileMenuOpen
                  ? 'Close navigation'
                  : 'Open navigation'
              }
              aria-expanded={mobileMenuOpen}
              aria-controls="navbar-mobile-menu"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                {mobileMenuOpen ? '×' : '☰'}
              </span>
            </Button>
          )}

          {/* Sidebar/menu button */}
          {onMenuClick && (
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={onMenuClick}
              aria-label="Open navigation"
            >
              <span aria-hidden="true" className="text-lg leading-none">
                ☰
              </span>
            </Button>
          )}

          {/* Brand */}
          <Link
            to={brandHref}
            className="group inline-flex min-w-0 items-center gap-2.5 rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/20"
          >
            {/* Logo */}
            <span
              aria-hidden="true"
              className={[
                'relative',
                'grid',
                'h-9',
                'w-9',
                'shrink-0',
                'place-items-center',
                'overflow-hidden',
                'rounded-xl',
                'border',
                'border-cyan-300/20',
                'bg-gradient-to-br',
                'from-cyan-400/90',
                'to-blue-600/90',
                'text-[11px]',
                'font-bold',
                'tracking-tight',
                'text-white',
                'shadow-[0_8px_25px_-10px_rgba(34,211,238,0.8)]',
                'transition-all',
                'duration-200',
                'group-hover:border-cyan-200/40',
                'group-hover:shadow-[0_10px_30px_-8px_rgba(34,211,238,0.9)]',
              ].join(' ')}
            >
              <span className="absolute inset-x-0 top-0 h-px bg-white/40" />
              <span className="relative z-10">JM</span>
            </span>

            {/* Brand name */}
            <span className="truncate text-sm font-bold tracking-tight text-white transition-colors group-hover:text-cyan-100">
              {brand}
            </span>
          </Link>
        </div>

        {/* Desktop / right-side actions */}
        <motion.div
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2"
        >
          {actions}
        </motion.div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && mobileMenuItems.length > 0 && (
            <motion.nav
              id="navbar-mobile-menu"
              aria-label="Mobile navigation"
              initial={{
                opacity: 0,
                y: -8,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -8,
                scale: 0.98,
              }}
              transition={{
                duration: 0.18,
                ease: 'easeOut',
              }}
              className={[
                'absolute',
                'inset-x-4',
                'top-[calc(100%+0.65rem)]',
                'z-40',
                'overflow-hidden',
                'rounded-2xl',
                'border',
                'border-white/10',
                'bg-slate-950/80',
                'p-2',
                'shadow-[0_25px_80px_-30px_rgba(0,0,0,0.95)]',
                'backdrop-blur-2xl',
                'sm:hidden',
              ].join(' ')}
            >
              {/* Mobile menu glass highlight */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent"
              />

              <div className="relative z-10">
                {mobileMenuItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={[
                      'flex',
                      'min-h-11',
                      'items-center',
                      'rounded-xl',
                      'border',
                      'border-transparent',
                      'px-3',
                      'text-sm',
                      'font-medium',
                      'text-slate-300',
                      'transition-all',
                      'duration-200',
                      'hover:border-white/10',
                      'hover:bg-white/[0.07]',
                      'hover:text-white',
                      'focus-visible:ring-4',
                      'focus-visible:ring-cyan-300/20',
                    ].join(' ')}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}