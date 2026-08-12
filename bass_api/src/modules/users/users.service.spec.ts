import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { UsersService } from './users.service';

type MockRepository = Partial<Record<keyof Repository<User>, jest.Mock>>;

const createMockRepository = (): MockRepository => ({
  findOne: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repository: MockRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: createMockRepository() },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(getRepositoryToken(User));
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve lançar ConflictException se o e-mail já existir', async () => {
      repository.findOne!.mockResolvedValue({ id: '1' } as User);

      await expect(
        service.create({ name: 'Ana', email: 'ana@email.com', password: 'senha1234' }),
      ).rejects.toThrow(ConflictException);
    });

    it('deve criar um usuário com senha em hash', async () => {
      repository.findOne!.mockResolvedValue(null);
      repository.create!.mockImplementation((data) => data);
      repository.save!.mockImplementation((data) => Promise.resolve({ id: '1', ...data }));

      const result = await service.create({
        name: 'Ana',
        email: 'ana@email.com',
        password: 'senha1234',
        role: UserRole.USER,
      });

      expect(result.id).toBe('1');
      expect(result.passwordHash).toBeDefined();
      expect(result.passwordHash).not.toBe('senha1234');
    });
  });

  describe('findOne', () => {
    it('deve lançar NotFoundException quando não encontrado', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.findOne('inexistente')).rejects.toThrow(NotFoundException);
    });
  });
});
