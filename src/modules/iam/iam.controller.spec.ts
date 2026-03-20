import { Test, TestingModule } from '@nestjs/testing';
import { IamController } from './iam.controller';
import { IamService } from './iam.service';
import { SignUpDto } from './dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto';
import { Role } from './entities/role.enum';

describe('IamController', () => {
  let controller: IamController;
  let service: IamService;

  const mockService = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
    getProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IamController],
      providers: [
        {
          provide: IamService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<IamController>(IamController);
    service = module.get<IamService>(IamService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signUp', () => {
    it('should call iamService.signUp', async () => {
      const dto: SignUpDto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: Role.USER,
      };
      const result = { message: 'User registered successfully', userId: '1' };
      mockService.signUp.mockResolvedValue(result);

      expect(await controller.signUp(dto)).toBe(result);
      expect(service.signUp).toHaveBeenCalledWith(dto);
    });
  });

  describe('signIn', () => {
    it('should call iamService.signIn', async () => {
      const dto: SignInDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const result = { access_token: 'at', refresh_token: 'rt', user: {} };
      mockService.signIn.mockResolvedValue(result);

      expect(await controller.signIn(dto)).toBe(result);
      expect(service.signIn).toHaveBeenCalledWith(dto);
    });
  });

  describe('getProfile', () => {
    it('should call iamService.getProfile', async () => {
      const user = { userId: '1' };
      const result = { id: '1', email: 'test@example.com' };
      mockService.getProfile.mockResolvedValue(result);

      expect(await controller.getProfile(user)).toBe(result);
      expect(service.getProfile).toHaveBeenCalledWith(user.userId);
    });
  });

  describe('logout', () => {
    it('should call iamService.logout', async () => {
      const user = { userId: '1' };
      const result = { message: 'Logged out successfully' };
      mockService.logout.mockResolvedValue(result);

      expect(await controller.logout(user)).toBe(result);
      expect(service.logout).toHaveBeenCalledWith(user.userId);
    });
  });
});
