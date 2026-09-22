/**
 * Fondo decorativo fijo: estrellas titilantes + un par de planetas flotando.
 * aria-hidden porque no aporta información, solo ambientación — un lector
 * de pantalla no debe perder tiempo en esto.
 */
export function CosmicBackdrop() {
  const stars = STAR_POSITIONS

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-100 via-sky-50 to-white" />

      {stars.map((s, i) => (
        <span
          key={i}
          className="star-twinkle absolute rounded-full bg-indigo-400"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            opacity: 0.5,
          }}
        />
      ))}

      <div
        className="planet-float absolute -top-10 -right-16 w-40 h-40 rounded-full opacity-40 blur-[1px]"
        style={{
          background:
            'radial-gradient(circle at 35% 30%, #C7D2FE, #4F46E5 70%)',
        }}
      />
      <div
        className="planet-float absolute top-1/3 -left-14 w-28 h-28 rounded-full opacity-30"
        style={{
          background:
            'radial-gradient(circle at 40% 35%, #FED7AA, #F97316 75%)',
          animationDelay: '-2.5s',
        }}
      />
    </div>
  )
}

const STAR_POSITIONS = [
  { top: '8%', left: '12%', size: '5px', delay: '0s' },
  { top: '15%', left: '78%', size: '4px', delay: '-1.2s' },
  { top: '22%', left: '45%', size: '3px', delay: '-2.1s' },
  { top: '30%', left: '90%', size: '5px', delay: '-0.6s' },
  { top: '38%', left: '20%', size: '3px', delay: '-2.8s' },
  { top: '48%', left: '65%', size: '4px', delay: '-1.6s' },
  { top: '58%', left: '8%', size: '4px', delay: '-3.2s' },
  { top: '66%', left: '85%', size: '3px', delay: '-0.3s' },
  { top: '74%', left: '35%', size: '5px', delay: '-2.4s' },
  { top: '84%', left: '55%', size: '3px', delay: '-1.9s' },
  { top: '90%', left: '15%', size: '4px', delay: '-0.9s' },
  { top: '5%', left: '60%', size: '3px', delay: '-3.6s' },
]
