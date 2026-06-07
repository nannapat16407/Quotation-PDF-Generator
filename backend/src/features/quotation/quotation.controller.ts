import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Response } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { QuotationService } from './quotation.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QuotationQueryDto } from './dto/quotation-query.dto';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Quotations')
@Controller('quotations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuotationController {
  constructor(
    private readonly quotationService: QuotationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('next-number')
  @ApiOperation({ summary: 'Get next quotation number' })
  getNextNumber() {
    return this.quotationService.getNextNumber();
  }

  @Get()
  @ApiOperation({ summary: 'List quotations (paginated, filterable)' })
  findAll(@Query() query: QuotationQueryDto) {
    return this.quotationService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quotation detail' })
  findOne(@Param('id') id: string) {
    return this.quotationService.findOne(id);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Preview quotation PDF in browser' })
  async previewPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.quotationService.getPdf(id);
    const quotation = await this.quotationService.findOne(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${quotation.quotationNumber}.pdf"`,
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download quotation PDF' })
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer = await this.quotationService.getPdf(id);
    const quotation = await this.quotationService.findOne(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${quotation.quotationNumber}.pdf"`,
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  }

  @Get(':id/drive-link')
  @ApiOperation({ summary: 'Get Google Drive link for quotation PDF' })
  getDriveLink(@Param('id') id: string) {
    return this.quotationService.getDriveLink(id);
  }

  @Post('upload-signature')
  @ApiOperation({ summary: 'Upload signature image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 },
      storage: diskStorage({
        destination: './uploads/signatures',
        filename: (req, file, cb) => {
          const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          cb(null, `${uniqueName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!['image/png', 'image/jpeg'].includes(file.mimetype)) {
          cb(new BadRequestException('Only PNG and JPEG files are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  uploadSignature(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = `/uploads/signatures/${file.filename}`;
    this.prisma.user.update({
      where: { id: userId },
      data: { signatureUrl: url },
    }).catch(() => {});
    return { url };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new quotation' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateQuotationDto,
  ) {
    return this.quotationService.create(userId, dto);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a quotation' })
  duplicate(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.quotationService.duplicate(id, userId);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update quotation status' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.quotationService.updateStatus(id, body.status);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a quotation' })
  update(@Param('id') id: string, @Body() dto: UpdateQuotationDto) {
    return this.quotationService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a quotation' })
  remove(@Param('id') id: string) {
    return this.quotationService.remove(id);
  }
}
