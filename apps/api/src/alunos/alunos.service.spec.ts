import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { PasswordService } from '../auth/password.service';
import { PrismaService } from '../prisma/prisma.service';
import { AlunosService } from './alunos.service';

describe('AlunosService', () => {
  const criarServico = async (prismaOverrides?: Record<string, unknown>) => {
    const db = {
      aluno: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
      presenca: { findMany: jest.fn().mockResolvedValue([]) },
      nota: { aggregate: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      movimentacao: { findMany: jest.fn().mockResolvedValue([]) },
      turma: { findFirst: jest.fn() },
      user: { findUnique: jest.fn(), create: jest.fn() },
      alunoResponsavel: { create: jest.fn(), deleteMany: jest.fn() },
      ...prismaOverrides,
    };
    const passwordService = { hash: jest.fn().mockResolvedValue('hash-fake') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AlunosService,
        { provide: PrismaService, useValue: { db } },
        { provide: PasswordService, useValue: passwordService },
      ],
    }).compile();

    return { service: moduleRef.get(AlunosService), prisma: db, passwordService };
  };

  describe('calcularFrequencia', () => {
    it('retorna mapa vazio quando não há alunos', async () => {
      const { service, prisma } = await criarServico();
      await expect(service.calcularFrequencia('tenant-1', [])).resolves.toEqual(new Map());
      expect(prisma.presenca.findMany).not.toHaveBeenCalled();
    });

    it('calcula o percentual de presença por aluno, arredondado', async () => {
      const { service } = await criarServico({
        presenca: {
          findMany: jest.fn().mockResolvedValue([
            { alunoId: 'aluno-1', status: 'PRESENTE' },
            { alunoId: 'aluno-1', status: 'PRESENTE' },
            { alunoId: 'aluno-1', status: 'FALTA' },
            { alunoId: 'aluno-2', status: 'FALTA' },
          ]),
        },
      });

      const resultado = await service.calcularFrequencia('tenant-1', ['aluno-1', 'aluno-2']);

      expect(resultado.get('aluno-1')).toBe(67);
      expect(resultado.get('aluno-2')).toBe(0);
    });
  });

  describe('listar', () => {
    it('junta os nomes dos responsáveis e usa "—" quando não há nenhum', async () => {
      const { service } = await criarServico({
        aluno: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'aluno-1',
              nome: 'Ana Costa',
              matricula: '2026-0002',
              status: 'ATIVO',
              turma: { nome: '5º Ano A' },
              responsaveis: [
                { parentesco: 'mãe', responsavel: { name: 'Maria Costa' } },
                { parentesco: 'pai', responsavel: { name: 'João Costa' } },
              ],
            },
            {
              id: 'aluno-2',
              nome: 'Lucas Andrade',
              matricula: '2026-0003',
              status: 'ATIVO',
              turma: null,
              responsaveis: [],
            },
          ]),
        },
      });

      const resultado = await service.listar('tenant-1');

      expect(resultado[0]).toMatchObject({
        nome: 'Ana Costa',
        turmaNome: '5º Ano A',
        responsaveis: 'Maria Costa (mãe), João Costa (pai)',
      });
      expect(resultado[1]).toMatchObject({ turmaNome: null, responsaveis: '—' });
    });
  });

  describe('perfil', () => {
    it('lança NotFoundException quando o aluno não existe no tenant', async () => {
      const { service, prisma } = await criarServico();
      (prisma.aluno.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.perfil('tenant-1', 'aluno-inexistente')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('mescla notas e movimentações em eventosRecentes, mais recente primeiro', async () => {
      const { service } = await criarServico({
        aluno: {
          findFirst: jest.fn().mockResolvedValue({
            id: 'aluno-1',
            nome: 'Pedro Pereira',
            matricula: '2026-0001',
            turma: { nome: '5º Ano A' },
            responsaveis: [],
            ocorrencias: [],
          }),
        },
        nota: {
          aggregate: jest.fn().mockResolvedValue({ _avg: { valor: null } }),
          findMany: jest.fn().mockResolvedValue([
            {
              createdAt: new Date('2026-03-10T12:00:00.000Z'),
              turmaDisciplina: { disciplina: { nome: 'Matemática' } },
            },
          ]),
        },
        movimentacao: {
          findMany: jest
            .fn()
            .mockResolvedValue([
              { dataHora: new Date('2026-03-12T09:00:00.000Z'), tipo: 'ENTRADA' },
            ]),
        },
      });

      const perfil = await service.perfil('tenant-1', 'aluno-1');

      expect(perfil.eventosRecentes).toHaveLength(2);
      expect(perfil.eventosRecentes[0]?.descricao).toBe('Entrada registrada');
      expect(perfil.eventosRecentes[1]?.descricao).toBe('Nota lançada em Matemática');
    });
  });

  describe('criar', () => {
    const dados = {
      nome: 'Nova Aluna',
      dataNascimento: '2016-05-10T00:00:00.000Z',
      matricula: '2026-0099',
    };

    it('cria o aluno sem turma quando turmaId não é informado', async () => {
      const { service, prisma } = await criarServico({
        aluno: { create: jest.fn().mockResolvedValue({ id: 'aluno-novo' }) },
      });

      const resultado = await service.criar('tenant-1', dados);

      expect(resultado).toEqual({ id: 'aluno-novo' });
      expect(prisma.aluno.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          nome: dados.nome,
          dataNascimento: new Date(dados.dataNascimento),
          matricula: dados.matricula,
          turmaId: null,
        },
      });
    });

    it('rejeita turmaId de outro tenant com BadRequestException', async () => {
      const { service, prisma } = await criarServico({
        turma: { findFirst: jest.fn().mockResolvedValue(null) },
      });

      await expect(
        service.criar('tenant-1', { ...dados, turmaId: 'turma-de-outro-tenant' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.turma.findFirst).toHaveBeenCalledWith({
        where: { id: 'turma-de-outro-tenant', tenantId: 'tenant-1' },
      });
    });

    it('rejeita matrícula duplicada com ConflictException', async () => {
      const erroPrisma = new Prisma.PrismaClientKnownRequestError('matrícula já existe', {
        code: 'P2002',
        clientVersion: '6.14.0',
      });
      const { service } = await criarServico({
        aluno: { create: jest.fn().mockRejectedValue(erroPrisma) },
      });

      await expect(service.criar('tenant-1', dados)).rejects.toThrow(
        'Já existe um aluno com essa matrícula',
      );
    });
  });

  describe('vincularResponsavel', () => {
    const dados = {
      nome: 'Maria Costa',
      email: 'maria@exemplo.com',
      senha: 'SenhaForte123',
      parentesco: 'mãe',
      podeRetirar: true,
    };

    it('lança NotFoundException quando o aluno não existe no tenant', async () => {
      const { service, prisma } = await criarServico();
      (prisma.aluno.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.vincularResponsavel('tenant-1', 'aluno-1', dados),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('cria uma conta nova quando o e-mail ainda não existe', async () => {
      const { service, prisma, passwordService } = await criarServico({
        aluno: { findFirst: jest.fn().mockResolvedValue({ id: 'aluno-1' }) },
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 'responsavel-novo' }),
        },
        alunoResponsavel: { create: jest.fn().mockResolvedValue({ id: 'vinculo-1' }) },
      });

      const resultado = await service.vincularResponsavel('tenant-1', 'aluno-1', dados);

      expect(resultado).toEqual({ id: 'vinculo-1' });
      expect(passwordService.hash).toHaveBeenCalledWith('SenhaForte123');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant-1',
          name: 'Maria Costa',
          email: 'maria@exemplo.com',
          passwordHash: 'hash-fake',
          role: 'RESPONSAVEL',
        },
      });
      expect(prisma.alunoResponsavel.create).toHaveBeenCalledWith({
        data: {
          alunoId: 'aluno-1',
          responsavelId: 'responsavel-novo',
          parentesco: 'mãe',
          podeRetirar: true,
        },
      });
    });

    it('reaproveita a conta existente quando o e-mail já pertence a um RESPONSAVEL do mesmo tenant', async () => {
      const { service, prisma, passwordService } = await criarServico({
        aluno: { findFirst: jest.fn().mockResolvedValue({ id: 'aluno-2' }) },
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'responsavel-existente',
            tenantId: 'tenant-1',
            role: 'RESPONSAVEL',
          }),
          create: jest.fn(),
        },
        alunoResponsavel: { create: jest.fn().mockResolvedValue({ id: 'vinculo-2' }) },
      });

      const resultado = await service.vincularResponsavel('tenant-1', 'aluno-2', dados);

      expect(resultado).toEqual({ id: 'vinculo-2' });
      expect(passwordService.hash).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.alunoResponsavel.create).toHaveBeenCalledWith({
        data: {
          alunoId: 'aluno-2',
          responsavelId: 'responsavel-existente',
          parentesco: 'mãe',
          podeRetirar: true,
        },
      });
    });

    it('rejeita quando o e-mail já pertence a uma conta de outro papel do mesmo tenant', async () => {
      const { service } = await criarServico({
        aluno: { findFirst: jest.fn().mockResolvedValue({ id: 'aluno-1' }) },
        user: {
          findUnique: jest
            .fn()
            .mockResolvedValue({ id: 'prof-1', tenantId: 'tenant-1', role: 'PROFESSOR' }),
        },
      });

      await expect(
        service.vincularResponsavel('tenant-1', 'aluno-1', dados),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita quando o e-mail já pertence a uma conta de outra instituição — `User.email` é único globalmente', async () => {
      const { service } = await criarServico({
        aluno: { findFirst: jest.fn().mockResolvedValue({ id: 'aluno-1' }) },
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'responsavel-outro-tenant',
            tenantId: 'tenant-2',
            role: 'RESPONSAVEL',
          }),
        },
      });

      await expect(
        service.vincularResponsavel('tenant-1', 'aluno-1', dados),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita conta nova sem senha informada', async () => {
      const { service } = await criarServico({
        aluno: { findFirst: jest.fn().mockResolvedValue({ id: 'aluno-1' }) },
        user: { findUnique: jest.fn().mockResolvedValue(null) },
      });

      await expect(
        service.vincularResponsavel('tenant-1', 'aluno-1', { ...dados, senha: undefined }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejeita vínculo duplicado com ConflictException', async () => {
      const erroPrisma = new Prisma.PrismaClientKnownRequestError('vínculo já existe', {
        code: 'P2002',
        clientVersion: '6.14.0',
      });
      const { service } = await criarServico({
        aluno: { findFirst: jest.fn().mockResolvedValue({ id: 'aluno-1' }) },
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'responsavel-existente',
            tenantId: 'tenant-1',
            role: 'RESPONSAVEL',
          }),
        },
        alunoResponsavel: { create: jest.fn().mockRejectedValue(erroPrisma) },
      });

      await expect(
        service.vincularResponsavel('tenant-1', 'aluno-1', dados),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('desvincularResponsavel', () => {
    it('remove o vínculo filtrando por tenant via o relacionamento com aluno', async () => {
      const { service, prisma } = await criarServico({
        alunoResponsavel: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) },
      });

      await service.desvincularResponsavel('tenant-1', 'aluno-1', 'responsavel-1');

      expect(prisma.alunoResponsavel.deleteMany).toHaveBeenCalledWith({
        where: {
          alunoId: 'aluno-1',
          responsavelId: 'responsavel-1',
          aluno: { tenantId: 'tenant-1' },
        },
      });
    });

    it('lança NotFoundException quando não havia vínculo pra remover', async () => {
      const { service } = await criarServico({
        alunoResponsavel: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
      });

      await expect(
        service.desvincularResponsavel('tenant-1', 'aluno-1', 'responsavel-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
