import { Sparkles, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const motivacionePoruke = [
  "Svaki dan je nova prilika da postignete nešto veliko. Vaš sistem je na pravom putu!",
  "Uspeh nije slučajnost - to je rezultat rada, upornosti, učenja i ljubavi prema onome što radite.",
  "Vaša posvećenost kvalitetu i profesionalizmu je ono što vas čini liderom!",
  "Svaki uspešan posao počinje jednim korakom. Vi ste već na putu - nastavite hrabro!",
  "U poslu, poverenje je sve. Nastavite da gradite poverenje i postižete rezultate!",
]

export default function DashboardPage() {
  // Nasumična poruka
  const randomIndex = Math.floor(Math.random() * motivacionePoruke.length)
  const motivacionaPoruka = motivacionePoruke[randomIndex]

  return (
    <div className="min-h-full">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* Hero sekcija */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl shadow-xl shadow-amber-500/25 mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Dobrodošli u Dashboard
          </h1>
          <p className="text-xl text-gray-500 max-w-xl mx-auto font-light">
            Izaberite modul iz menija da počnete sa radom
          </p>
        </div>

        {/* Motivaciona poruka */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 relative overflow-hidden mb-12">
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>
          <div className="relative">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-2xl">💡</span>
              </div>
              <div>
                <p className="text-gray-700 leading-relaxed italic text-lg">
                  &quot;{motivacionaPoruka}&quot;
                </p>
                <p className="text-xs text-amber-600 mt-4 font-bold tracking-wider">MOTIVACIJA DANA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Brzi pristup modulima */}
        <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Brzi pristup</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Link 
              href="/dashboard/korisnici"
              className="group bg-gray-50 hover:bg-gradient-to-br hover:from-amber-50 hover:to-amber-100 rounded-2xl p-6 transition-all duration-300 cursor-pointer border border-transparent hover:border-amber-200 hover:shadow-lg"
            >
              <div className="w-14 h-14 bg-gray-200 group-hover:bg-gradient-to-br group-hover:from-amber-400 group-hover:to-amber-600 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-amber-500/25">
                <Users className="w-7 h-7 text-gray-600 group-hover:text-white transition-colors" />
              </div>
              <p className="font-bold text-gray-900 text-lg">Korisnici</p>
              <p className="text-sm text-gray-500 mt-1">Upravljanje korisnicima sistema</p>
            </Link>
            
            <div className="group bg-gray-50 rounded-2xl p-6 border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-gray-200 rounded-2xl flex items-center justify-center mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <p className="font-bold text-gray-400 text-lg">Novi moduli</p>
              <p className="text-sm text-gray-400 mt-1">Uskoro dolaze...</p>
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <div className="mt-10 flex items-center justify-center gap-3 text-gray-400">
          <ArrowRight className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-medium">Kliknite na bilo koji modul u meniju da počnete</span>
        </div>
      </div>
    </div>
  )
}
