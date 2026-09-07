import {
  type DashboardAdminResponse,
  dashboardAdminResponseSchema,
  type DashboardProfessorResponse,
  dashboardProfessorResponseSchema,
  type DashboardSuperAdminResponse,
  dashboardSuperAdminResponseSchema,
} from '@arbora/contracts';

import { serverFetch } from './server-api';

export function buscarDashboardAdmin(): Promise<DashboardAdminResponse> {
  return serverFetch('dashboard/admin', { schema: dashboardAdminResponseSchema });
}

export function buscarDashboardProfessor(): Promise<DashboardProfessorResponse> {
  return serverFetch('dashboard/professor', { schema: dashboardProfessorResponseSchema });
}

export function buscarDashboardSuperAdmin(): Promise<DashboardSuperAdminResponse> {
  return serverFetch('dashboard/super-admin', { schema: dashboardSuperAdminResponseSchema });
}
