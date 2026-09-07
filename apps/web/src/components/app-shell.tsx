import { type User } from '@arbora/contracts';
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  Layers,
  LayoutGrid,
  Megaphone,
  NotebookPen,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { LogoutButton } from './logout-button';
import { ThemeToggle } from './theme-toggle';

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
  roles: User['role'][];
};

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: LayoutGrid,
    roles: ['ADMIN_ESCOLAR', 'COORDENACAO', 'PROFESSOR', 'RESPONSAVEL'],
  },
  { href: '/alunos', label: 'Alunos', icon: Users, roles: ['ADMIN_ESCOLAR', 'COORDENACAO'] },
  { href: '/turmas', label: 'Turmas', icon: Layers, roles: ['ADMIN_ESCOLAR', 'COORDENACAO'] },
  {
    href: '/disciplinas',
    label: 'Disciplinas',
    icon: BookOpen,
    roles: ['ADMIN_ESCOLAR', 'COORDENACAO'],
  },
  {
    href: '/professores',
    label: 'Professores',
    icon: GraduationCap,
    roles: ['ADMIN_ESCOLAR', 'COORDENACAO'],
  },
  { href: '/chamada', label: 'Chamada', icon: ClipboardCheck, roles: ['PROFESSOR'] },
  { href: '/notas', label: 'Notas', icon: NotebookPen, roles: ['PROFESSOR'] },
  {
    href: '/comunicados',
    label: 'Comunicados',
    icon: Megaphone,
    roles: ['ADMIN_ESCOLAR', 'COORDENACAO', 'PROFESSOR'],
  },
  {
    href: '/agenda',
    label: 'Agenda',
    icon: CalendarDays,
    roles: ['ADMIN_ESCOLAR', 'COORDENACAO', 'PROFESSOR', 'RESPONSAVEL'],
  },
  { href: '/super-admin', label: 'Instituições', icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
];

/** Casca compartilhada pelas telas autenticadas: menu lateral + topo, como no protótipo do Stitch. */
export function AppShell({ user, children }: { user: User; children: ReactNode }) {
  const items = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <div className="flex min-h-dvh">
      <aside className="flex w-64 shrink-0 flex-col bg-[var(--color-brand-600)] p-4 text-white">
        <span className="mb-8 px-2 text-lg font-bold tracking-tight">Arbora</span>
        <nav className="flex flex-1 flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-(--radius-card) flex items-center gap-3 px-3 py-2 text-sm font-medium text-[var(--color-brand-100)] hover:bg-[var(--color-brand-700)] hover:text-white"
            >
              <item.icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-[var(--color-brand-700)] pt-4 text-sm">
          <p className="font-medium">{user.name}</p>
          <p className="mb-3 text-[var(--color-brand-100)]">{user.role}</p>
          <div className="mb-3">
            <ThemeToggle />
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex-1 overflow-x-auto">{children}</div>
    </div>
  );
}
