import { redirect } from 'next/navigation';

import { buscarDashboardAdmin, buscarDashboardProfessor } from '@/lib/dashboard';
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
    case 'PROFESSOR': {
      const data = await buscarDashboardProfessor();
      return <ProfessorDashboard nome={user.name} data={data} />;
    }
    case 'RESPONSAVEL':
      return <ResponsavelDashboard />;
    case 'ADMIN_ESCOLAR':
    case 'COORDENACAO': {
      const data = await buscarDashboardAdmin();
      return <AdminDashboard data={data} />;
    }
  }
}
