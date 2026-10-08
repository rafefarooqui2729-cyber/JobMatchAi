import { AnimatePresence, motion } from 'framer-motion';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { motionVariants } from '../../design-system/motion.js';

const ToastContext = createContext(null);

const tones = {
  success: {
    container:
      'border-emerald-300/20 bg-emerald-400/[0.07]',
    icon:
      'bg-emerald-400/[0.10] text-emerald-300 ring-emerald-300/15',
    accent: 'bg-emerald-300',
  },

  error: {
    container:
      'border-rose-300/20 bg-rose-400/[0.07]',
    icon:
      'bg-rose-400/[0.10] text-rose-300 ring-rose-300/15',
    accent: 'bg-rose-300',
  },

  warning: {
    container:
      'border-amber-300/20 bg-amber-400/[0.07]',
    icon:
      'bg-amber-400/[0.10] text-amber-300 ring-amber-300/15',
    accent: 'bg-amber-300',
  },

  info: {
    container:
      'border-cyan-300/20 bg-cyan-400/[0.07]',
    icon:
      'bg-cyan-400/[0.10] text-cyan-300 ring-cyan-300/15',
    accent: 'bg-cyan-300',
  },
};

function ToneIcon({ tone }) {
  if (tone === 'success') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          d="m6 12 4 4 8-8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (tone === 'error') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          d="M12 8v4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 16h.01"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M10.3 4.6 3.5 16.4A2 2 0 0 0 5.23 19.4h13.54a2 2 0 0 0 1.73-3L13.7 4.6a2 2 0 0 0-3.4 0Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  if (tone === 'warning') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <path
          d="M12 8v4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 16h.01"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 10v5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M12 7h.01"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Toast({
  message,
  tone = 'info',
  onDismiss,
}) {
  const toneStyle = tones[tone] || tones.info;

  return (
    <motion.div
      variants={motionVariants.item}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, x: 12, scale: 0.98 }}
      role={tone === 'error' ? 'alert' : 'status'}
      className={`
        pointer-events-auto
        relative
        flex
        w-full
        items-start
        gap-3
        overflow-hidden
        rounded-2xl
        border
        p-3.5
        backdrop-blur-2xl
        shadow-[0_18px_55px_rgba(0,0,0,0.28)]
        ${toneStyle.container}
      `}
    >
      {/* Accent line */}
      <span
        aria-hidden="true"
        className={`
          absolute
          bottom-3
          left-0
          top-3
          w-0.5
          rounded-full
          ${toneStyle.accent}
        `}
      />

      {/* Top glass highlight */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-4
          top-0
          h-px
          bg-gradient-to-r
          from-transparent
          via-white/20
          to-transparent
        "
      />

      {/* Icon */}
      <span
        aria-hidden="true"
        className={`
          relative
          mt-0.5
          grid
          h-8
          w-8
          shrink-0
          place-items-center
          rounded-xl
          ring-1
          ring-inset
          ${toneStyle.icon}
        `}
      >
        <ToneIcon tone={tone} />
      </span>

      {/* Message */}
      <p
        className="
          min-w-0
          flex-1
          pt-1
          text-sm
          font-medium
          leading-5
          text-slate-100
        "
      >
        {message}
      </p>

      {/* Dismiss */}
      {onDismiss && (
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={onDismiss}
          className="
            mt-0.5
            grid
            h-8
            w-8
            shrink-0
            place-items-center
            rounded-lg
            text-lg
            leading-none
            text-slate-400
            transition
            hover:bg-white/[0.08]
            hover:text-white
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-cyan-300/60
          "
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((items) =>
      items.filter((item) => item.id !== id),
    );
  }, []);

  const toast = useCallback(
    (
      message,
      {
        tone = 'info',
        duration = 5000,
      } = {},
    ) => {
      const id = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;

      setToasts((items) => [
        ...items,
        {
          id,
          message,
          tone,
        },
      ]);

      if (duration > 0) {
        window.setTimeout(
          () => dismiss(id),
          duration,
        );
      }
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      toast,
      dismiss,
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-label="Notifications"
        className="
          pointer-events-none
          fixed
          inset-x-4
          bottom-4
          z-[120]
          flex
          flex-col
          items-end
          gap-2
          sm:left-auto
          sm:w-96
        "
        aria-live="polite"
        aria-relevant="additions"
      >
        <AnimatePresence initial={false}>
          {toasts.map((item) => (
            <Toast
              key={item.id}
              message={item.message}
              tone={item.tone}
              onDismiss={() => dismiss(item.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      'useToast must be used inside ToastProvider.',
    );
  }

  return context.toast;
}