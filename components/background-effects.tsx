'use client'

import { motion } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'

export default function BackgroundEffects() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Generamos las partículas solo una vez en el cliente para evitar errores de hidratación
  const particles = useMemo(() => {
    if (!mounted) return []
    return [...Array(20)].map((_, i) => ({
      id: i,
      x: Math.random() * 100 + "%",
      y: Math.random() * 100 + "%",
      opacity: Math.random() * 0.5 + 0.1,
      duration: Math.random() * 20 + 20,
      delay: Math.random() * 20,
      drift: (Math.random() - 0.5) * 50 + "%"
    }))
  }, [mounted])

  if (!mounted) return null

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Texture Layer */}
      <div className="absolute inset-0 bg-dot-pattern opacity-40" />
      
      {/* Animated Blobs */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]"
      />
      
      <motion.div
        animate={{
          x: [0, -100, 0],
          y: [0, -50, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[100px]"
      />

      {/* Particles Layer */}
      <div className="absolute inset-0">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              x: p.x,
              y: p.y,
              opacity: p.opacity,
            }}
            animate={{
              y: [null, "-20%", "120%"],
              x: [null, p.drift],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: "linear",
              delay: p.delay,
            }}
            className="absolute w-1 h-1 bg-white rounded-full"
          />
        ))}
      </div>

      {/* Static Gradient Overlay for Depth */}
      <div className="absolute inset-0 bg-gradient-to-tr from-background via-transparent to-background/30" />
    </div>
  )
}
