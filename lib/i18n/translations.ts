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
      formDivider: 'ili popunite formu',
      form: {
        name: 'Ime i prezime',
        namePlaceholder: 'Vaše ime',
        email: 'Email adresa',
        emailPlaceholder: 'vas@email.com',
        phone: 'Telefon',
        phonePlaceholder: '+381 63 123 4567',
        message: 'Poruka',
        messagePlaceholder: 'Opišite vašu nekretninu ili pitanje...',
        submit: 'Pošalji poruku',
        submitting: 'Slanje...',
        success: 'Poruka je uspešno poslata! Javićemo vam se uskoro.',
        error: 'Greška pri slanju. Molimo pokušajte ponovo.',
        validation: {
          nameRequired: 'Ime je obavezno',
          nameMin: 'Ime mora imati najmanje 2 karaktera',
          emailRequired: 'Email je obavezan',
          emailInvalid: 'Unesite validnu email adresu',
          phoneRequired: 'Telefon je obavezan',
          phoneMin: 'Telefon mora imati najmanje 6 cifara',
          messageRequired: 'Poruka je obavezna',
          messageMin: 'Poruka mora imati najmanje 10 karaktera',
        },
      },
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
      formDivider: 'or fill out the form',
      form: {
        name: 'Full name',
        namePlaceholder: 'Your name',
        email: 'Email address',
        emailPlaceholder: 'you@email.com',
        phone: 'Phone',
        phonePlaceholder: '+381 63 123 4567',
        message: 'Message',
        messagePlaceholder: 'Describe your property or question...',
        submit: 'Send message',
        submitting: 'Sending...',
        success: 'Message sent successfully! We will get back to you soon.',
        error: 'Error sending message. Please try again.',
        validation: {
          nameRequired: 'Name is required',
          nameMin: 'Name must be at least 2 characters',
          emailRequired: 'Email is required',
          emailInvalid: 'Please enter a valid email address',
          phoneRequired: 'Phone is required',
          phoneMin: 'Phone must be at least 6 digits',
          messageRequired: 'Message is required',
          messageMin: 'Message must be at least 10 characters',
        },
      },
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
    formDivider: string
    form: {
      name: string
      namePlaceholder: string
      email: string
      emailPlaceholder: string
      phone: string
      phonePlaceholder: string
      message: string
      messagePlaceholder: string
      submit: string
      submitting: string
      success: string
      error: string
      validation: {
        nameRequired: string
        nameMin: string
        emailRequired: string
        emailInvalid: string
        phoneRequired: string
        phoneMin: string
        messageRequired: string
        messageMin: string
      }
    }
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
