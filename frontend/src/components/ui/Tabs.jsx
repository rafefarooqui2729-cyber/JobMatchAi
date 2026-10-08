import { useId, useRef, useState } from 'react';

export default function Tabs({
  tabs = [],
  defaultValue,
  value: controlledValue,
  onChange,
  className = '',
}) {
  if (!tabs.length) return null;

  const generatedId = useId();

  const [internalValue, setInternalValue] = useState(
    defaultValue ?? tabs[0]?.value
  );

  const selected = controlledValue ?? internalValue;
  const tabRefs = useRef([]);

  function select(value) {
    if (controlledValue === undefined) {
      setInternalValue(value);
    }

    onChange?.(value);
  }

  function onKeyDown(event, index) {
    let nextIndex = index;

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (index + 1) % tabs.length;
        break;

      case 'ArrowLeft':
        nextIndex = (index - 1 + tabs.length) % tabs.length;
        break;

      case 'Home':
        nextIndex = 0;
        break;

      case 'End':
        nextIndex = tabs.length - 1;
        break;

      default:
        return;
    }

    event.preventDefault();

    const tab = tabs[nextIndex];

    select(tab.value);
    tabRefs.current[nextIndex]?.focus();
  }

  const active = tabs.find((tab) => tab.value === selected) ?? tabs[0];

  return (
    <div className={`w-full ${className}`}>
      {/* =========================================================
          TAB LIST
      ========================================================== */}
      <div
        role="tablist"
        aria-label="Sections"
        className="
          relative
          flex
          max-w-full
          gap-1
          overflow-x-auto
          rounded-2xl
          border
          border-white/[0.09]
          bg-white/[0.045]
          p-1
          shadow-[0_12px_40px_rgba(0,0,0,0.16)]
          backdrop-blur-2xl
          scrollbar-none
        "
      >
        {/* Outer glass highlight */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-x-3
            top-0
            z-20
            h-px
            bg-gradient-to-r
            from-transparent
            via-white/20
            to-transparent
          "
        />

        {tabs.map((tab, index) => {
          const isSelected = selected === tab.value;

          return (
            <button
              key={tab.value}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              id={`${generatedId}-tab-${tab.value}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={`${generatedId}-panel-${tab.value}`}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => select(tab.value)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`
                group
                relative
                min-h-10
                shrink-0
                overflow-hidden
                rounded-xl
                border
                px-4
                text-sm
                font-semibold
                outline-none
                transition-all
                duration-200

                focus-visible:ring-2
                focus-visible:ring-cyan-400/40
                focus-visible:ring-offset-1
                focus-visible:ring-offset-transparent

                ${
                  isSelected
                    ? `
                      border-cyan-300/20
                      bg-gradient-to-r
                      from-cyan-300/[0.15]
                      via-blue-400/[0.10]
                      to-white/[0.045]
                      text-white
                      shadow-[0_7px_24px_rgba(8,15,35,0.24)]
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
              {/* Active bottom indicator */}
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="
                    absolute
                    bottom-0.5
                    left-1/2
                    h-0.5
                    w-8
                    -translate-x-1/2
                    rounded-full
                    bg-cyan-300
                    shadow-[0_0_12px_rgba(103,232,249,0.80)]
                  "
                />
              )}

              {/* Active top reflection */}
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    inset-x-2
                    top-0
                    h-px
                    bg-gradient-to-r
                    from-transparent
                    via-white/25
                    to-transparent
                  "
                />
              )}

              {/* Hover reflection */}
              {!isSelected && (
                <span
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    inset-x-3
                    top-0
                    h-px
                    bg-gradient-to-r
                    from-transparent
                    via-white/[0.10]
                    to-transparent
                    opacity-0
                    transition-opacity
                    duration-200
                    group-hover:opacity-100
                  "
                />
              )}

              <span className="relative z-10 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* =========================================================
          ACTIVE PANEL
      ========================================================== */}
      {active && (
        <div
          id={`${generatedId}-panel-${active.value}`}
          role="tabpanel"
          aria-labelledby={`${generatedId}-tab-${active.value}`}
          tabIndex={0}
          className="
            relative
            mt-4
            overflow-hidden
            rounded-2xl
            border
            border-white/[0.08]
            bg-white/[0.035]
            p-4
            shadow-[0_12px_40px_rgba(0,0,0,0.12)]
            outline-none
            backdrop-blur-xl
            focus-visible:ring-2
            focus-visible:ring-cyan-400/30
            sm:p-5
          "
        >
          {/* Panel top highlight */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-x-0
              top-0
              h-px
              bg-gradient-to-r
              from-transparent
              via-white/[0.16]
              to-transparent
            "
          />

          <div className="relative">
            {active.content}
          </div>
        </div>
      )}
    </div>
  );
}