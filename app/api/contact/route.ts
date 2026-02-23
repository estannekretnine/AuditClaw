import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(6, 'Phone must be at least 6 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'estannekretnine@gmail.com'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const result = contactSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { name, email, phone, message } = result.data

    const { error } = await resend.emails.send({
      from: 'AuditClaw <onboarding@resend.dev>',
      to: [CONTACT_EMAIL],
      replyTo: email,
      subject: `Nova poruka sa sajta - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FFB300; border-bottom: 2px solid #FFB300; padding-bottom: 10px;">
            Nova poruka sa AuditClaw sajta
          </h2>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Ime:</strong> ${name}</p>
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p style="margin: 0 0 10px 0;"><strong>Telefon:</strong> <a href="tel:${phone}">${phone}</a></p>
          </div>
          
          <div style="background: #121212; color: #E0E0E0; padding: 20px; border-radius: 8px;">
            <h3 style="color: #FFB300; margin-top: 0;">Poruka:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>
          
          <p style="color: #666; font-size: 12px; margin-top: 20px;">
            Ova poruka je poslata sa kontakt forme na auditclaw.io
          </p>
        </div>
      `,
      text: `
Nova poruka sa AuditClaw sajta

Ime: ${name}
Email: ${email}
Telefon: ${phone}

Poruka:
${message}

---
Ova poruka je poslata sa kontakt forme na auditclaw.io
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
