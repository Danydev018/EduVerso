'use client'

import { motion } from 'framer-motion'

export function AnimatedMain({ children }: { children: React.ReactNode }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex-1 p-6 overflow-auto"
    >
      {children}
    </motion.main>
  )
}
