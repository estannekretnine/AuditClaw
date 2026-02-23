import { type Translations } from '@/lib/i18n/translations'

interface WhyAuditClawProps {
  t: Translations
}

export function WhyAuditClaw({ t }: WhyAuditClawProps) {
  const reasons = [
    { key: 'independence' as const, icon: '◇' },
    { key: 'expertise' as const, icon: '◈' },
    { key: 'remote' as const, icon: '◉' },
  ]

  return (
    <section id="about" className="py-16 sm:py-24 border-t border-border" aria-labelledby="why-title">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 
          id="why-title" 
          className="font-sans text-2xl sm:text-3xl font-bold text-foreground mb-12 text-center"
        >
          {t.why.title}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reasons.map(({ key, icon }) => {
            const reason = t.why[key]
            return (
              <article key={key} className="text-center">
                <span 
                  className="inline-block text-4xl text-accent mb-4" 
                  role="img" 
                  aria-hidden="true"
                >
                  {icon}
                </span>
                <h3 className="font-sans text-xl font-semibold text-foreground mb-3">
                  {reason.title}
                </h3>
                <p className="text-foreground-secondary leading-relaxed">
                  {reason.description}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
