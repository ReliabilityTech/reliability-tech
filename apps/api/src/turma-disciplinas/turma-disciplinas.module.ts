import { Module } from '@nestjs/common';

import { TurmaDisciplinasController } from './turma-disciplinas.controller';
import { TurmaDisciplinasService } from './turma-disciplinas.service';

@Module({
  controllers: [TurmaDisciplinasController],
  providers: [TurmaDisciplinasService],
  exports: [TurmaDisciplinasService],
})
export class TurmaDisciplinasModule {}
