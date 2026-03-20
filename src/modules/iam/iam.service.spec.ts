import { Test, TestingModule } from '@nestjs/testing';
import { IamService } from './iam.service';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Branch } from '../system/entities/branch.entity';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('IamService', () => {
  let service: IamService;
  let userRepository: any;
  let branchRepository: any;
  let jwtService: JwtService;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockBranchRepository = {
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IamService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Branch),
          useValue: mockBranchRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<IamService>(IamService);
    userRepository = module.get(getRepositoryToken(User));
    branchRepository = module.get(getRepositoryToken(Branch));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signUp', () => {
    it('should throw ConflictException if user exists', async () => {
      const dto = { email: 'test@example.com', password: 'password', fullName: 'Test' };
      mockUserRepository.findOne.mockResolvedValue({ id: '1' });

      await expect(service.signUp(dto)).rejects.toThrow(ConflictException);
    });

    it('should create and save a new user', async () => {
      const dto = { email: 'new@example.com', password: 'password', fullName: 'New User' };
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(dto);
      mockUserRepository.save.mockResolvedValue({ id: '2', ...dto });

      const result = await service.signUp(dto);
      expect(result.message).toBe('User registered successfully');
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });

  describe('signIn', () => {
    it('should throw UnauthorizedException for invalid credentials', async () => {
      const dto = { email: 'test@example.com', password: 'wrong' };
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.signIn(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens for valid credentials', async () => {
      const dto = { email: 'test@example.com', password: 'password' };
      const user = { 
        id: '1', 
        email: 'test@example.com', 
        passwordHash: await bcrypt.hash('password', 10),
        status: 'ACTIVE',
        role: 'USER'
      };
      mockUserRepository.findOne.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValue('mock-token');

      const result = await service.signIn(dto);
      expect(result.access_token).toBe('mock-token');
      expect(result.refresh_token).toBe('mock-token');
    });
  });
});
