import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { PasswordService } from '../auth/password.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsuariosService } from './usuarios.service';

describe('UsuariosService', () => {
  const criarServico = async (prismaOverrides?: Record<string, unknown>) => {
    const prisma = {
      user: { findMany: jest.fn(), create: jest.fn() },
      ...prismaOverrides,
    };
    const passwordService = { hash: jest.fn().mockResolvedValue('hash-fake') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsuariosService,
        { provide: PrismaService, useValue: prisma },
        { provide: PasswordService, useValue: passwordService },
      ],
    }).compile();

    return { service: moduleRef.get(UsuariosService), prisma, passwordService };
  };

  describe('listarProfessores', () => {
    it('lista só os usuários com papel PROFESSOR do tenant', async () => {
      const { service, prisma } = await criarServico({
        user: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'prof-1',
              name: 'Professor João',
              email: 'joao@escola.local',
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
              turmasLecionadas: [],
            },
          ]),
        },
      });

      const resultado = await service.listarProfessores('tenant-1');

      expect(resultado).toEqual([
        {
          id: 'prof-1',
          name: 'Professor João',
          email: 'joao@escola.local',
          createdAt: '2026-01-01T00:00:00.000Z',
          turmasAtribuidas: [],
        },
      ]);
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1', role: 'PROFESSOR', deletedAt: null },
        include: { turmasLecionadas: { include: { turma: true, disciplina: true } } },
        orderBy: { name: 'asc' },
      });
    });

    it('formata as turmas atribuídas como "<turma> — <disciplina>"', async () => {
      const { service } = await criarServico({
        user: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'prof-1',
              name: 'Professor João',
              email: 'joao@escola.local',
              createdAt: new Date('2026-01-01T00:00:00.000Z'),
              turmasLecionadas: [
                { turma: { nome: '5º Ano A' }, disciplina: { nome: 'Matemática' } },
                { turma: { nome: '6º Ano B' }, disciplina: { nome: 'Português' } },
              ],
            },
          ]),
        },
      });

      const resultado = await service.listarProfessores('tenant-1');

      expect(resultado[0]?.turmasAtribuidas).toEqual([
        '5º Ano A — Matemática',
        '6º Ano B — Português',
      ]);
    });
  });

  describe('criarProfessor', () => {
    const dados = { name: 'Professor Novo', email: 'novo@escola.local', password: 'SenhaForte123' };

    it('hashea a senha e cria o usuário com papel PROFESSOR fixo', async () => {
      const { service, prisma, passwordService } = await criarServico({
        user: { create: jest.fn().mockResolvedValue({ id: 'prof-novo' }) },
      });

      const resultado = await service.criarProfessor('tenant-1', dados);

      expect(resultado).toEqual({ id: 'prof-novo' });
      expect(passwordService.hash).toHaveBeenCalledWith('SenhaForte123');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          name: 'Professor Novo',
          email: 'novo@escola.local',
          passwordHash: 'hash-fake',
          role: 'PROFESSOR',
        },
      });
    });

    it('rejeita e-mail duplicado com ConflictException', async () => {
      const erroPrisma = new Prisma.PrismaClientKnownRequestError('e-mail já existe', {
        code: 'P2002',
        clientVersion: '6.14.0',
      });
      const { service } = await criarServico({
        user: { create: jest.fn().mockRejectedValue(erroPrisma) },
      });

      await expect(service.criarProfessor('tenant-1', dados)).rejects.toThrow(
        'Já existe um usuário com esse e-mail',
      );
    });
  });
});
