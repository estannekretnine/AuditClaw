import { Suspense } from 'react'
import SobaClientPage from './soba-client'

export default function SobaPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-amber-500" />
        </div>
      }
    >
      <SobaClientPage />
    </Suspense>
  )
}
