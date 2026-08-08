'use client'

import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function AnimatedContainer({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="show"
      variants={containerVariants}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={itemVariants}>
      {children}
    </motion.div>
  )
}

export function AnimatedGrid({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      variants={containerVariants}
    >
      {children}
    </motion.div>
  )
}
