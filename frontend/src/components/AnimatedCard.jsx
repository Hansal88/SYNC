import React from 'react';
import { motion } from 'framer-motion';

const AnimatedCard = ({
  children,
  className = '',
  hoverScale = 1.02,
  initial = { opacity: 0, y: 20 },
  animate = { opacity: 1, y: 0 },
  transition = { duration: 0.3 },
  whileHover = null,
  ...props
}) => {
  const defaultHover = { scale: hoverScale };

  return (
    <motion.div
      className={className}
      initial={initial}
      animate={animate}
      transition={transition}
      whileHover={whileHover || defaultHover}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;