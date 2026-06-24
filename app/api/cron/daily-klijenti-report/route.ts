import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import nodemailer from 'nodemailer'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createAdminClient()

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: klijenti, error } = await supabase
      .from('klijenti')
      .select('*')
      .gte('datumupisa', yesterday.toISOString())
      .lt('datumupisa', today.toISOString())
      .order('datumupisa', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (!klijenti || klijenti.length === 0) {
      console.log('No new clients from yesterday')
      return NextResponse.json({ 
        success: true, 
        message: 'No new clients from yesterday',
        count: 0 
      })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleString('sr-RS', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const getKlijentType = (k: typeof klijenti[0]) => {
      const types = []
      if (k.stsagencijazanekretnine) types.push('Agencija za nekretnine')
      if (k.stsinvestitor) types.push('Investitor')
      if (k.stskupac) types.push('Kupac')
      if (k.stsprijateljsajta) types.push('Prijatelj sajta')
      if (k.stsprodavac) types.push('Prodavac')
      if (k.stsekspert) types.push('Ekspert')
      if (k.stsinvestitoraudit) types.push('Investitor Audit')
      return types.length > 0 ? types.join(', ') : '-'
    }

    const tableRows = klijenti.map(k => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${k.ime || '-'}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${k.prezime || '-'}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${k.firma || '-'}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${k.email || '-'}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${k.kontakt || '-'}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${getKlijentType(k)}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${k.datumupisa ? formatDate(k.datumupisa) : '-'}</td>
      </tr>
    `).join('')

    const yesterdayFormatted = yesterday.toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Dnevni izvještaj - Novi klijenti</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            Dnevni izvještaj - Novi klijenti
          </h1>
          <p style="color: #666; font-size: 16px;">
            Datum: <strong>${yesterdayFormatted}</strong><br>
            Ukupno novih klijenata: <strong>${klijenti.length}</strong>
          </p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #007bff; color: white;">
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Ime</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Prezime</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Firma</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Email</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Kontakt</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Tip</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Datum upisa</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
            Ovaj email je automatski generisan od strane AuditClaw sistema.
          </p>
        </div>
      </body>
      </html>
    `

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: 'estannekretnine@gmail.com',
      subject: `Dnevni izvještaj - ${klijenti.length} novih klijenata (${yesterdayFormatted})`,
      html: htmlContent,
    })

    console.log(`Daily report sent: ${klijenti.length} clients`)

    return NextResponse.json({ 
      success: true, 
      message: `Email sent with ${klijenti.length} clients`,
      count: klijenti.length 
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
