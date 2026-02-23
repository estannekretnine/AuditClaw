import { type Translations } from '@/lib/i18n/translations'

interface ServicesProps {
  t: Translations
}

export function Services({ t }: ServicesProps) {
  const services = [
    { key: 'structural' as const, icon: '⬡' },
    { key: 'systems' as const, icon: '⚡' },
    { key: 'report' as const, icon: '📋' },
  ]

  return (
    <section id="services" className="py-16 sm:py-24" aria-labelledby="services-title">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 
          id="services-title" 
          className="font-sans text-2xl sm:text-3xl font-bold text-foreground mb-12 text-center"
        >
          {t.services.title}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map(({ key, icon }) => {
            const service = t.services[key]
            return (
              <article
                key={key}
                className="border border-border rounded-lg p-6 sm:p-8 bg-surface/50 hover:border-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl" role="img" aria-hidden="true">{icon}</span>
                  {service.badge && (
                    <span className="text-xs font-mono px-2 py-1 bg-accent/20 text-accent rounded">
                      {service.badge}
                    </span>
                  )}
                </div>
                <h3 className="font-sans text-xl font-semibold text-foreground mb-3">
                  {service.title}
                </h3>
                <p className="text-foreground-secondary leading-relaxed">
                  {service.description}
                </p>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
