import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Application render failed.', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          className="
            relative
            grid
            min-h-screen
            place-items-center
            overflow-hidden
            bg-[#050b18]
            px-4
            py-10
          "
        >
          {/* Ambient background glow */}
          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              left-1/2
              top-1/2
              h-[520px]
              w-[520px]
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              bg-rose-500/[0.06]
              blur-[120px]
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              left-[15%]
              top-[20%]
              h-40
              w-40
              rounded-full
              bg-cyan-400/[0.045]
              blur-[90px]
            "
          />

          <section
            role="alert"
            className="
              relative
              w-full
              max-w-lg
              overflow-hidden
              rounded-3xl
              border
              border-white/10
              bg-white/[0.055]
              p-7
              text-center
              shadow-[0_30px_80px_rgba(0,0,0,0.35)]
              backdrop-blur-2xl
              sm:p-10
            "
          >
            {/* Glass top highlight */}
            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                inset-x-8
                top-0
                h-px
                bg-gradient-to-r
                from-transparent
                via-white/25
                to-transparent
              "
            />

            {/* Error icon */}
            <span
              aria-hidden="true"
              className="
                relative
                mx-auto
                grid
                h-14
                w-14
                place-items-center
                rounded-2xl
                border
                border-rose-300/20
                bg-rose-400/[0.10]
                text-xl
                font-bold
                text-rose-300
                shadow-[0_0_30px_rgba(244,63,94,0.08)]
              "
            >
              <span
                aria-hidden="true"
                className="
                  absolute
                  inset-0
                  rounded-2xl
                  bg-gradient-to-br
                  from-white/[0.08]
                  to-transparent
                "
              />

              <span className="relative">!</span>
            </span>

            <h1
              className="
                mt-6
                text-xl
                font-semibold
                tracking-tight
                text-white
              "
            >
              This page hit an unexpected error
            </h1>

            <p
              className="
                mx-auto
                mt-3
                max-w-md
                text-sm
                leading-6
                text-slate-400
              "
            >
              Your account data is unchanged. Reload the page or
              return to the JobMatch home page.
            </p>

            <div
              className="
                mt-7
                flex
                flex-col
                justify-center
                gap-3
                sm:flex-row
              "
            >
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="
                  relative
                  inline-flex
                  min-h-11
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-xl
                  border
                  border-cyan-300/20
                  bg-gradient-to-r
                  from-cyan-400/90
                  to-blue-500/90
                  px-5
                  text-sm
                  font-semibold
                  text-white
                  shadow-[0_10px_30px_rgba(34,211,238,0.10)]
                  outline-none
                  transition-all
                  duration-200
                  hover:from-cyan-300
                  hover:to-blue-400
                  hover:shadow-[0_12px_35px_rgba(34,211,238,0.16)]
                  focus-visible:ring-4
                  focus-visible:ring-cyan-400/15
                "
              >
                <span
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    inset-x-4
                    top-0
                    h-px
                    bg-white/30
                  "
                />

                <span className="relative">
                  Reload page
                </span>
              </button>

              <Link
                to="/"
                onClick={() => this.setState({ hasError: false })}
                className="
                  inline-flex
                  min-h-11
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-white/10
                  bg-white/[0.055]
                  px-5
                  text-sm
                  font-semibold
                  text-slate-200
                  backdrop-blur-xl
                  outline-none
                  transition-all
                  duration-200
                  hover:border-white/15
                  hover:bg-white/[0.09]
                  hover:text-white
                  focus-visible:ring-4
                  focus-visible:ring-cyan-400/10
                "
              >
                Return home
              </Link>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}