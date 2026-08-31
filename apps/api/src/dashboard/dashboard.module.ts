import { Module } from '@nestjs/common';

import { AlunosModule } from '../alunos/alunos.module';
import { ProfessorModule } from '../professor/professor.module';
import { TenantsModule } from '../tenants/tenants.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [AlunosModule, ProfessorModule, TenantsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
