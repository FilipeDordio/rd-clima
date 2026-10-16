import type { ComponentType } from 'react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  IconAlertTriangle,
  IconCalendar,
  IconChartBar,
  IconHardHat,
  IconLogOut,
  IconMaintenance,
  IconMenu,
  IconSettings,
  IconSun,
  IconUser,
  IconUsers,
  IconWrench,
} from './icons'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  end?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const HOJE: NavItem = { to: '/hoje', label: 'Hoje', icon: IconSun }
const PERFIL: NavItem = { to: '/perfil', label: 'Perfil', icon: IconUser }
const CLIENTES: NavItem = { to: '/admin/clientes', label: 'Clientes', icon: IconUsers }
const TECNICOS: NavItem = { to: '/admin/tecnicos', label: 'Técnicos', icon: IconHardHat }
const SERVICOS: NavItem = { to: '/admin/servicos', label: 'Serviços', icon: IconWrench }
const MANUTENCOES: NavItem = { to: '/admin/manutencoes', label: 'Manutenções', icon: IconMaintenance }
const ESTATISTICAS: NavItem = { to: '/admin/estatisticas', label: 'Estatísticas', icon: IconChartBar }
const POR_REMARCAR: NavItem = { to: '/admin/por-remarcar', label: 'Por remarcar', icon: IconAlertTriangle }
const CONFIGURACOES: NavItem = { to: '/admin/configuracoes', label: 'Configurações', icon: IconSettings }

export function Layout() {
  const { profile, signOut } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const isAdmin = profile?.role === 'admin'
  const calendario: NavItem = isAdmin
    ? { to: '/admin', label: 'Calendário', icon: IconCalendar, end: true }
    : { to: '/', label: 'Calendário', icon: IconCalendar, end: true }

  const topNavItems: NavItem[] = isAdmin
    ? [
        HOJE,
        calendario,
        POR_REMARCAR,
        SERVICOS,
        TECNICOS,
        CLIENTES,
        MANUTENCOES,
        ESTATISTICAS,
        CONFIGURACOES,
        PERFIL,
      ]
    : [HOJE, calendario, PERFIL]

  const bottomNavItems: NavItem[] = isAdmin ? [HOJE, calendario, CLIENTES] : [HOJE, calendario, PERFIL]

  const drawerGroups: NavGroup[] = [
    { label: 'Operação', items: [HOJE, calendario, POR_REMARCAR] },
    { label: 'Gestão', items: [CLIENTES, TECNICOS, SERVICOS, MANUTENCOES] },
    { label: 'Relatórios', items: [ESTATISTICAS] },
    { label: 'Conta', items: [PERFIL, CONFIGURACOES] },
  ]

  const topLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive ? 'bg-gold text-ink' : 'text-paper/70 hover:bg-white/10 hover:text-paper'
    }`

  const tabLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition ${
      isActive ? 'text-gold' : 'text-paper/50'
    }`

  const drawerLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-medium transition ${
      isActive ? 'bg-warn-soft text-gold-deep' : 'text-ink hover:bg-paper'
    }`

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="bg-ink">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Abrir menu"
                className={`-ml-1.5 rounded-lg p-1.5 transition hover:bg-white/10 sm:hidden ${
                  drawerOpen ? 'text-gold' : 'text-paper/70'
                }`}
              >
                <IconMenu className="h-5 w-5" />
              </button>
            )}
            <img src="/logo.png" alt="RD Clima" className="h-8 w-8 rounded-full" />
            <span className="text-sm font-bold text-paper">RD Clima</span>
          </div>

          <nav className="hidden items-center gap-1 sm:flex">
            {topNavItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={topLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.nome}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : null}
            <span className="hidden text-sm text-paper/70 sm:inline">{profile?.nome}</span>
            <button
              onClick={() => signOut()}
              title="Sair"
              className="rounded-lg p-2 text-paper/70 transition hover:bg-white/10 hover:text-paper sm:px-3 sm:py-2 sm:text-sm sm:font-medium"
            >
              <IconLogOut className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-6 pb-24 sm:px-4 sm:pb-6">
        <Outlet />
      </main>

      <footer className="mt-auto hidden border-t border-line bg-white px-4 py-4 text-center text-xs text-muted sm:block">
        RD Clima — Rui Dimas, Unipessoal Lda · 969 170 928 · Ar Condicionado · Bombas de Calor ·
        Solar Térmico · Instalações Hidráulicas
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-ink-soft bg-ink pb-[env(safe-area-inset-bottom)] sm:hidden">
        {bottomNavItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={tabLinkClass}>
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {isAdmin && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
            className={`fixed inset-0 z-50 bg-black/45 transition-opacity duration-300 sm:hidden ${
              drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          />
          <div
            className={`fixed inset-y-0 left-0 z-50 flex w-[78%] max-w-xs flex-col overflow-y-auto bg-white p-4 pb-6 shadow-xl transition-transform duration-300 sm:hidden ${
              drawerOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="mb-4 flex items-center gap-3 border-b border-line pb-4">
              <img src="/logo.png" alt="" className="h-10 w-10 rounded-full" />
              <div>
                <p className="text-sm font-bold text-ink">{profile?.nome}</p>
                <p className="text-xs text-muted">Administrador</p>
              </div>
            </div>

            {drawerGroups.map((group) => (
              <div key={group.label} className="mb-4">
                <p className="mb-1.5 px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setDrawerOpen(false)}
                      className={drawerLinkClass}
                    >
                      <item.icon className="h-4 w-4 text-gold-deep" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                setDrawerOpen(false)
                signOut()
              }}
              className="mt-auto flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-medium text-danger transition hover:bg-danger-soft"
            >
              <IconLogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </>
      )}
    </div>
  )
}
