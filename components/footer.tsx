import Image from 'next/image'

export function Footer() {
  return (
    <div className="p-4 text-sm text-emerald-100/80">
      <div className="flex flex-col items-center gap-2 border-t border-emerald-700/50 pt-4">
        <Image 
          src="/logo_epamig_branca.svg" 
          alt="Logo EPAMIG" 
          width={200}
          height={80}
          priority={true}
          className="w-auto h-auto"
        />
        <div className="text-center text-xs">
          <p>Desenvolvimento: ASTI</p>
          <p>© 2025 Painel Gestão</p>
        </div>
      </div>
    </div>
  )
}
