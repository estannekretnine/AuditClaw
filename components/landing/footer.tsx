import { type Translations } from '@/lib/i18n/translations'

interface FooterProps {
  t: Translations
}

export function Footer({ t }: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="py-8 border-t border-border" role="contentinfo">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="font-mono text-foreground font-semibold">
              {t.footer.company}
            </p>
            <p className="text-foreground-secondary text-sm mt-1">
              {t.footer.tagline}
            </p>
          </div>
          
          <p className="text-foreground-secondary text-sm">
            © {currentYear} {t.footer.company}. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  )
}
