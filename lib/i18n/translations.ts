export type Language = 'sr' | 'en'

export const translations = {
  sr: {
    meta: {
      title: 'AuditClaw - Inženjerski Audit Nekretnina',
      description: 'Tehnička provera i stručni audit objekata u Srbiji za investitore iz dijaspore. Vaš inženjer na terenu, od temelja do krova.',
    },
    nav: {
      services: 'Usluge',
      about: 'O nama',
      contact: 'Kontakt',
      login: 'Prijava',
    },
    hero: {
      title: 'Inženjerski Due Diligence: Kupujte nekretninu na osnovu činjenica, ne obećanja.',
      subtitle: 'Tehnička provera i stručni audit objekata u Srbiji za investitore iz dijaspore. Vaš inženjer na terenu, od temelja do krova.',
    },
    services: {
      title: 'Tri Stuba Audita',
      structural: {
        title: 'Struktura i Statika',
        description: 'Detaljna provera nosećih elemenata, kvaliteta gradnje i hidroizolacije. Identifikujemo skrivene mane, vlagu i naprsline koje "šminka" prikriva.',
        badge: null,
      },
      systems: {
        title: 'Instalacije i Sistemi',
        description: 'Pregled elektro, vodovodnih i HVAC sistema. Provera energetske efikasnosti i usklađenosti sa projektovanim stanjem.',
        badge: 'U pripremi',
      },
      report: {
        title: 'Elaborat i Procena',
        description: 'Dobijate jasan tehnički izveštaj sa procenom troškova neophodnih sanacija. Matematički precizna slika stanja pre nego što potpišete ugovor.',
        badge: 'U pripremi',
      },
    },
    why: {
      title: 'Zašto AuditClaw?',
      independence: {
        title: 'Nezavisnost',
        description: 'Mi ne prodajemo stanove. Mi prodajemo istinu o stanovima.',
      },
      expertise: {
        title: 'Lokalna ekspertiza',
        description: 'Poznajemo specifičnosti domaće gradnje i uobičajene propuste izvođača.',
      },
      remote: {
        title: 'Daljinski nadzor',
        description: 'Vi ste u Cirihu ili Beču, mi smo vaše oči i uši na gradilištu u Beogradu ili Novom Sadu.',
      },
    },
    trust: {
      title: 'Verifikacija',
      text: 'Svi naši auditi su potpisani od strane licenciranih inženjera.',
      linkedinButton: 'Pogledaj LinkedIn Verifikaciju',
    },
    contact: {
      title: 'Zakažite konsultacije',
      whatsappButton: 'Zakažite konsultacije sa inženjerom',
      whatsappMessage: 'Zdravo, zainteresovan sam za tehnički audit nekretnine.',
    },
    footer: {
      company: 'AuditClaw Engineering',
      tagline: 'Struka ispred prodaje. Verifikovano na LinkedIn-u.',
      rights: 'Sva prava zadržana.',
    },
    skipToContent: 'Preskoči na sadržaj',
  },
  en: {
    meta: {
      title: 'AuditClaw - Engineering Real Estate Audit',
      description: 'Technical inspection and expert audit of properties in Serbia for diaspora investors. Your engineer on the ground, from foundation to roof.',
    },
    nav: {
      services: 'Services',
      about: 'About',
      contact: 'Contact',
      login: 'Login',
    },
    hero: {
      title: 'Engineering Due Diligence: Buy real estate based on facts, not promises.',
      subtitle: 'Technical inspection and expert audit of properties in Serbia for diaspora investors. Your engineer on the ground, from foundation to roof.',
    },
    services: {
      title: 'Three Pillars of Audit',
      structural: {
        title: 'Structural Integrity',
        description: 'Detailed inspection of load-bearing elements, construction quality, and waterproofing. We identify hidden defects, moisture, and cracks that cosmetic fixes conceal.',
        badge: null,
      },
      systems: {
        title: 'Systems Audit',
        description: 'Review of electrical, plumbing, and HVAC systems. Verification of energy efficiency and compliance with project specifications.',
        badge: 'Coming Soon',
      },
      report: {
        title: 'Expert Report',
        description: 'You receive a clear technical report with cost estimates for necessary repairs. A mathematically precise picture of the condition before you sign the contract.',
        badge: 'Coming Soon',
      },
    },
    why: {
      title: 'Why AuditClaw?',
      independence: {
        title: 'Independence',
        description: "We don't sell apartments. We sell the truth about apartments.",
      },
      expertise: {
        title: 'Local Expertise',
        description: 'We know the specifics of local construction and common contractor oversights.',
      },
      remote: {
        title: 'Remote Oversight',
        description: 'You are in Zurich or Vienna, we are your eyes and ears on the construction site in Belgrade or Novi Sad.',
      },
    },
    trust: {
      title: 'Verification',
      text: 'All our audits are signed by licensed engineers.',
      linkedinButton: 'View LinkedIn Verification',
    },
    contact: {
      title: 'Schedule a Consultation',
      whatsappButton: 'Schedule a consultation with an engineer',
      whatsappMessage: 'Hello, I am interested in a technical property audit.',
    },
    footer: {
      company: 'AuditClaw Engineering',
      tagline: 'Profession before sales. Verified on LinkedIn.',
      rights: 'All rights reserved.',
    },
    skipToContent: 'Skip to content',
  },
} as const

export interface Translations {
  meta: {
    title: string
    description: string
  }
  nav: {
    services: string
    about: string
    contact: string
    login: string
  }
  hero: {
    title: string
    subtitle: string
  }
  services: {
    title: string
    structural: {
      title: string
      description: string
      badge: string | null
    }
    systems: {
      title: string
      description: string
      badge: string | null
    }
    report: {
      title: string
      description: string
      badge: string | null
    }
  }
  why: {
    title: string
    independence: {
      title: string
      description: string
    }
    expertise: {
      title: string
      description: string
    }
    remote: {
      title: string
      description: string
    }
  }
  trust: {
    title: string
    text: string
    linkedinButton: string
  }
  contact: {
    title: string
    whatsappButton: string
    whatsappMessage: string
  }
  footer: {
    company: string
    tagline: string
    rights: string
  }
  skipToContent: string
}

export function getTranslations(lang: Language): Translations {
  return translations[lang]
}
