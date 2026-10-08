export const motionVariants = Object.freeze({
  page: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
  },
  card: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
    hover: { y: -2, transition: { duration: 0.16 } },
  },
  modal: {
    initial: { opacity: 0, y: 12, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: 8, scale: 0.985, transition: { duration: 0.16 } },
  },
  sidebar: {
    open: { x: 0, transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] } },
    closed: { x: '-100%', transition: { duration: 0.2 } },
  },
  stagger: {
    animate: { transition: { staggerChildren: 0.055 } },
  },
  item: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.22 } },
  },
});

export const interactiveMotion = {
  whileTap: { scale: 0.98 },
  transition: { duration: 0.14 },
};
