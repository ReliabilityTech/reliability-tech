import { redirect } from 'next/navigation';

import { getServerUser } from '@/lib/server-session';

import { AdminDashboard } from './admin-dashboard';
import { ProfessorDashboard } from './professor-dashboard';
import { ResponsavelDashboard } from './responsavel-dashboard';

export default async function DashboardPage() {
  const user = await getServerUser();
  if (!user) redirect('/login');

  switch (user.role) {
    case 'SUPER_ADMIN':
      redirect('/super-admin');
      break;
    case 'PROFESSOR':
      return <ProfessorDashboard nome={user.name} />;
    case 'RESPONSAVEL':
      return <ResponsavelDashboard nomeAluno="Pedro Pereira" />;
    case 'ADMIN_ESCOLAR':
    case 'COORDENACAO':
      return <AdminDashboard />;
  }
}
