import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PkiService } from '../services/pki.service';
import { SignDocumentDto } from '../dto/sign-document.dto';
import { JwtAuthGuard } from '../../iam/guards/jwt-auth.guard';
import { Role } from '../../iam/entities/role.enum';
import { Roles } from '../../iam/decorators/roles.decorator';
import { RolesGuard } from '../../iam/guards/roles.guard';
import { CurrentUser } from '../../iam/decorators/current-user.decorator';
import { E2ETestingService } from '../../system/e2e-testing.service';

@ApiTags('PKI') // Digital Signature Gateway
@Controller('pki')
export class PkiController {
  constructor(
    private readonly pkiService: PkiService,
    private readonly e2eService: E2ETestingService
  ) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Chạy kịch bản kiểm thử E2E (Epic 15)' })
  @Roles(Role.CEO)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('e2e-test')
  async runE2E(@CurrentUser() user: any) {
     return this.e2eService.runFullLifecycleTest(user.id, user.id, user.id, user.id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách các tài liệu PKI chờ ký hoặc đã ký' })
  @UseGuards(JwtAuthGuard)
  @Get('documents')
  async getDocuments(@CurrentUser() user: any) {
    return this.pkiService.getDocuments(user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy các chứng thư số hiện đang hoạt động (CA Certificates)' })
  @UseGuards(JwtAuthGuard)
  @Get('certificates')
  async getCertificates() {
    return this.pkiService.getCertificates();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thực hiện Ký văn bản bằng chứng thư số' })
  @Roles(Role.CEO, Role.PM, Role.CLIENT) // PM (Effort), CLIENT (Price), CEO (Invoice/Final)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('sign')
  async sign(@Body() signDocumentDto: SignDocumentDto) {
    const { documentId, documentContent } = signDocumentDto;
    return this.pkiService.signDocument(documentId, documentContent || '');
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Từ chối Ký văn bản và gửi thông báo cho người khởi tạo' })
  @Roles(Role.CEO, Role.PM, Role.CLIENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('reject')
  async reject(@Body() data: { documentId: string, reason: string, initiatorId: string, role: string }) {
    // role: Vai trò của người từ chối (PM/CLIENT) để hiển thị trong thông báo
    return this.pkiService.rejectDocument(data.documentId, data.reason, data.role, data.initiatorId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy nhật ký truy vết (Audit Trail) cho PKI' })
  @Roles(Role.CEO)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('audit')
  async getPkiAudit() {
    // Tạm thời trả về mock dữ liệu nhật ký giao dịch PKI
    return [
      { user: 'Admin Alex', action: 'Ký duyệt Hợp đồng v2', time: '11:15' },
      { user: 'Partner Tokyo', action: 'Mở tài liệu Giai đoạn 1', time: '10:42' },
      { user: 'System Bot', action: 'Xác thực CA RSA-4096', time: '09:15' },
    ];
  }
}
