import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { getPusherServer, isPusherConfigured } from '@/lib/pusher/server'

export async function POST(request: NextRequest) {
  try {
    if (!isPusherConfigured()) {
      return NextResponse.json(
        { error: 'Pusher nije konfigurisan na serveru.' },
        { status: 503 }
      )
    }

    const formData = await request.formData()
    const socketId = formData.get('socket_id') as string | null
    const channelName = formData.get('channel_name') as string | null

    if (!socketId || !channelName) {
      return NextResponse.json(
        { error: 'Nedostaju socket_id ili channel_name.' },
        { status: 400 }
      )
    }

    if (!channelName.startsWith('presence-soba-')) {
      return NextResponse.json({ error: 'Nedozvoljen kanal.' }, { status: 403 })
    }

    const user = await getCurrentUser()
    const userId = user?.id ? String(user.id) : `guest-${socketId.slice(0, 8)}`
    const userInfo = {
      name: user?.naziv || user?.email || 'Učesnik',
      email: user?.email || null,
      role: user?.stsstatus || 'student',
    }

    const pusher = getPusherServer()
    const authResponse = pusher.authorizeChannel(socketId, channelName, {
      user_id: userId,
      user_info: userInfo,
    })

    return NextResponse.json(authResponse)
  } catch (error) {
    console.error('POST /api/pusher/auth:', error)
    const message = error instanceof Error ? error.message : 'Nepoznata greška'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
