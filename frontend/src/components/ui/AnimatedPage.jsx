import { motion } from 'framer-motion';
import { motionVariants } from '../../design-system/motion.js';

export default function AnimatedPage({
  children,
  className = '',
  ...props
}) {
  return (
    <motion.main
      variants={motionVariants.page}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`
        relative
        z-0
        w-full
        min-w-0
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.main>
  );
}