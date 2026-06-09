import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PdfService } from '../pdf/pdf.service';
import { GoogleDriveService } from '../../integrations/google-drive/google-drive.service';
import { SupplierService } from '../supplier/supplier.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QuotationQueryDto } from './dto/quotation-query.dto';
import { Prisma } from '../../generated/prisma/client';
import { QuotationPdfData } from '../pdf/templates/quotation-pdf';

const DEFAULT_CONTACT_INFO =
  'Super HR Co., Ltd. | 287 Silom Rd, Silom, Bang Rak, Bangkok 10500 | cs@superhr.biz | www.superhr.biz | 02-077-7581';

import * as path from 'path';
import * as fs from 'fs';

interface FinancialData {
  items: { qty: number; unitPrice: number; amount: number }[];
  discount: number;
  vatEnabled: boolean;
}

@Injectable()
export class QuotationService {
  private readonly logger = new Logger(QuotationService.name);

  private recalculateFinances(data: FinancialData) {
    const packageAmount = data.items
      .filter((i) => (i as any).type === 'PACKAGE')
      .reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const addonsAmount = data.items
      .filter((i) => (i as any).type === 'ADDON')
      .reduce((s, i) => s + i.qty * i.unitPrice, 0);
    const subtotal = packageAmount + addonsAmount - data.discount;
    const vatAmount = data.vatEnabled ? Math.round(subtotal * 0.07 * 100) / 100 : 0;
    const totalAmount = subtotal + vatAmount;
    return { packageAmount, addonsAmount, discount: data.discount, subtotal, vatAmount, totalAmount };
  }

  private validateFinances(dto: any, label: string) {
    if (!dto.items || dto.items.length === 0) return dto;
    const calc = this.recalculateFinances({
      items: dto.items,
      discount: dto.discount || 0,
      vatEnabled: dto.vatEnabled ?? false,
    });

    const mismatches: string[] = [];
    if (dto.packageAmount !== undefined && Math.abs(dto.packageAmount - calc.packageAmount) > 0.01) {
      mismatches.push(`packageAmount: sent=${dto.packageAmount} calc=${calc.packageAmount}`);
    }
    if (dto.addonsAmount !== undefined && Math.abs(dto.addonsAmount - calc.addonsAmount) > 0.01) {
      mismatches.push(`addonsAmount: sent=${dto.addonsAmount} calc=${calc.addonsAmount}`);
    }
    if (dto.subtotal !== undefined && Math.abs(dto.subtotal - calc.subtotal) > 0.01) {
      mismatches.push(`subtotal: sent=${dto.subtotal} calc=${calc.subtotal}`);
    }
    if (dto.totalAmount !== undefined && Math.abs(dto.totalAmount - calc.totalAmount) > 0.01) {
      mismatches.push(`totalAmount: sent=${dto.totalAmount} calc=${calc.totalAmount}`);
    }

    if (mismatches.length > 0) {
      this.logger.warn(`Financial mismatch on ${label}: ${mismatches.join(', ')}`);
    }

    // Override with server-calculated values
    dto.packageAmount = calc.packageAmount;
    dto.addonsAmount = calc.addonsAmount;
    dto.discount = calc.discount;
    dto.subtotal = calc.subtotal;
    dto.vatAmount = calc.vatAmount;
    dto.totalAmount = calc.totalAmount;

    // Recalculate item amounts too
    dto.items = dto.items.map((item: any) => ({
      ...item,
      amount: item.qty * item.unitPrice,
    }));

    return dto;
  }

  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
    private googleDriveService: GoogleDriveService,
    private supplierService: SupplierService,
  ) {}

  async generateQuotationNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `QUO${year}${month}`;

    const lastQuotation = await this.prisma.quotation.findFirst({
      where: { quotationNumber: { startsWith: prefix } },
      orderBy: { quotationNumber: 'desc' },
      select: { quotationNumber: true },
    });

    let nextSeq = 1;
    if (lastQuotation) {
      const lastSeq = parseInt(lastQuotation.quotationNumber.slice(-3), 10);
      nextSeq = lastSeq + 1;
    }

    const seq = String(nextSeq).padStart(3, '0');
    return `${prefix}${seq}`;
  }

  async getNextNumber() {
    const quotationNumber = await this.generateQuotationNumber();
    return { quotationNumber };
  }

  private resolveSignatureBase64(signatureUrl: string | null | undefined): string | undefined {
    if (!signatureUrl) return undefined;
    // If already a base64 data URL, return as-is
    if (signatureUrl.startsWith('data:')) return signatureUrl;
    // Resolve file path to base64
    const filePath = path.resolve(process.cwd(), signatureUrl.replace(/^\//, ''));
    if (!fs.existsSync(filePath)) return undefined;
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
    const base64 = fs.readFileSync(filePath).toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  private async getSupplierSnapshot(quotation: any): Promise<{
    companyName: string;
    companyNameTh?: string;
    taxId: string;
    address: string;
    contactInfo: string;
  }> {
    if (quotation.supplierSnapshot) {
      const snap = quotation.supplierSnapshot as any;
      return {
        companyName: snap.companyName || '',
        companyNameTh: snap.companyNameTh || undefined,
        taxId: snap.taxId || '',
        address: snap.address || '',
        contactInfo: snap.contactInfo || DEFAULT_CONTACT_INFO,
      };
    }
    // Fallback for old quotations without snapshot
    const supplier = await this.supplierService.get();
    return {
      companyName: supplier?.companyName || '',
      companyNameTh: supplier?.companyNameTh || undefined,
      taxId: supplier?.taxId || '',
      address: supplier?.address || '',
      contactInfo: (supplier as any)?.contactInfo || DEFAULT_CONTACT_INFO,
    };
  }

  private async buildPdfData(quotation: any): Promise<QuotationPdfData> {
    const supplier = await this.getSupplierSnapshot(quotation);
    const validUntilDate = new Date(quotation.validUntil);
    const dueDate = new Date(validUntilDate);
    dueDate.setMonth(dueDate.getMonth() + 1);

    return {
      quotationNumber: quotation.quotationNumber,
      issuedDate: quotation.issuedDate,
      validUntil: quotation.validUntil,
      supplier: {
        companyName: supplier.companyName,
        companyNameTh: supplier.companyNameTh || undefined,
        taxId: supplier.taxId,
        address: supplier.address,
      },
      contactInfo: supplier.contactInfo,
      customer: {
        companyName: quotation.customerCompany,
        companyNameTh: quotation.customerCompanyTh || undefined,
        taxId: quotation.customerTaxId || undefined,
        address: quotation.customerAddress || undefined,
      },
      package: {
        name: quotation.package?.name || '',
        billingType: quotation.billingType,
        price: Number(quotation.packageAmount),
        dueDate: dueDate.toLocaleDateString('th-TH', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      },
      items: (quotation.items || []).map((item: any) => ({
        description: item.description,
        descriptionTh: item.descriptionTh || undefined,
        qty: item.qty,
        unitPrice: Number(item.unitPrice),
        amount: Number(item.amount),
        type: item.type,
      })),
      offers: (quotation.offerRecords || []).map((o: any) => ({
        name: o.name,
        nameTh: o.nameTh || undefined,
      })),
      packageAmount: Number(quotation.packageAmount),
      addonsAmount: Number(quotation.addonsAmount),
      discount: Number(quotation.discount),
      subtotal: Number(quotation.subtotal),
      vatEnabled: quotation.vatEnabled,
      vatAmount: Number(quotation.vatAmount),
      totalAmount: Number(quotation.totalAmount),
      signatureUrl: this.resolveSignatureBase64(quotation.signatureUrl),
    };
  }

  private async generateAndUploadPdf(quotation: any): Promise<{
    driveFileId: string | null;
    driveUrl: string | null;
    pdfFileSize: string | null;
  }> {
    try {
      const pdfData = await this.buildPdfData(quotation);
      const pdfBuffer = await this.pdfService.generateQuotationPdf(pdfData);
      const fileName = `${quotation.quotationNumber}.pdf`;

      const driveResult = await this.googleDriveService.uploadFile(
        fileName,
        pdfBuffer,
        'application/pdf',
      );

      return {
        driveFileId: driveResult.fileId,
        driveUrl: driveResult.webViewLink,
        pdfFileSize: driveResult.size,
      };
    } catch (error) {
      this.logger.error(`PDF generation/upload failed: ${error.message}`, error.stack);
      return { driveFileId: null, driveUrl: null, pdfFileSize: null };
    }
  }

  private async updateDrivePdf(quotation: any): Promise<{
    driveFileId: string | null;
    driveUrl: string | null;
    pdfFileSize: string | null;
  }> {
    try {
      const pdfData = await this.buildPdfData(quotation);
      const pdfBuffer = await this.pdfService.generateQuotationPdf(pdfData);

      if (quotation.driveFileId) {
        const driveResult = await this.googleDriveService.updateFile(
          quotation.driveFileId,
          pdfBuffer,
          'application/pdf',
        );
        return {
          driveFileId: driveResult.fileId,
          driveUrl: driveResult.webViewLink,
          pdfFileSize: driveResult.size,
        };
      }

      const fileName = `${quotation.quotationNumber}.pdf`;
      const driveResult = await this.googleDriveService.uploadFile(
        fileName,
        pdfBuffer,
        'application/pdf',
      );
      return {
        driveFileId: driveResult.fileId,
        driveUrl: driveResult.webViewLink,
        pdfFileSize: driveResult.size,
      };
    } catch (error) {
      this.logger.error(`PDF regeneration/upload failed: ${error.message}`, error.stack);
      return {
        driveFileId: quotation.driveFileId,
        driveUrl: quotation.driveUrl,
        pdfFileSize: quotation.pdfFileSize,
      };
    }
  }

  async create(userId: string, dto: CreateQuotationDto) {
    dto = this.validateFinances(dto, 'create');
    const quotationNumber = await this.generateQuotationNumber();

    // Snapshot current supplier data for immutable PDF rendering
    const supplier = await this.supplierService.get();
    const supplierSnapshot = {
      companyName: supplier?.companyName || '',
      companyNameTh: supplier?.companyNameTh || undefined,
      taxId: supplier?.taxId || '',
      address: supplier?.address || '',
      contactInfo: (supplier as any)?.contactInfo || DEFAULT_CONTACT_INFO,
    };

    const quotation = await this.prisma.quotation.create({
      data: {
        quotationNumber,
        customerCompany: dto.customerCompany,
        customerCompanyTh: dto.customerCompanyTh,
        customerTaxId: dto.customerTaxId,
        customerAddress: dto.customerAddress,
        issuedDate: new Date(dto.issuedDate),
        validUntil: new Date(dto.validUntil),
        packageId: dto.packageId,
        billingType: dto.billingType,
        packageAmount: dto.packageAmount,
        addonsAmount: dto.addonsAmount,
        discount: dto.discount,
        subtotal: dto.subtotal,
        vatEnabled: dto.vatEnabled ?? false,
        vatAmount: dto.vatAmount,
        totalAmount: dto.totalAmount,
        signatureUrl: dto.signatureUrl,
        supplierSnapshot: supplierSnapshot as any,
        createdById: userId,
        items: {
          create: dto.items.map((item, index) => ({
            type: item.type,
            description: item.description,
            descriptionTh: item.descriptionTh,
            qty: item.qty,
            unitPrice: item.unitPrice,
            amount: item.amount,
            sortOrder: item.sortOrder ?? index,
          })),
        },
        offerRecords: dto.offers
          ? {
              create: dto.offers.map((offer) => ({
                specialOfferId: offer.specialOfferId,
                name: offer.name,
                nameTh: offer.nameTh,
                isCustom: offer.isCustom ?? false,
              })),
            }
          : undefined,
      },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        offerRecords: true,
        package: true,
        createdBy: {
          select: { id: true, name: true, email: true, signatureUrl: true },
        },
      },
    });

    // Generate PDF + upload to Drive
    const driveMeta = await this.generateAndUploadPdf(quotation);

    // Update with drive metadata
    const updated = await this.prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        driveFileId: driveMeta.driveFileId,
        driveUrl: driveMeta.driveUrl,
        pdfFileSize: driveMeta.pdfFileSize,
      },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        offerRecords: true,
        package: true,
        createdBy: {
          select: { id: true, name: true, email: true, signatureUrl: true },
        },
      },
    });

    return {
      ...updated,
      pdfGenerated: !!driveMeta.driveFileId,
      driveUploaded: !!driveMeta.driveUrl,
    };
  }

  async update(id: string, dto: UpdateQuotationDto) {
    await this.findOne(id);

    dto = this.validateFinances(dto, `update ${id}`);

    // Refresh supplier snapshot on update
    const supplier = await this.supplierService.get();
    const supplierSnapshot = {
      companyName: supplier?.companyName || '',
      companyNameTh: supplier?.companyNameTh || undefined,
      taxId: supplier?.taxId || '',
      address: supplier?.address || '',
      contactInfo: (supplier as any)?.contactInfo || DEFAULT_CONTACT_INFO,
    };

    const data: Prisma.QuotationUpdateInput = {
      customerCompany: dto.customerCompany,
      customerCompanyTh: dto.customerCompanyTh,
      customerTaxId: dto.customerTaxId,
      customerAddress: dto.customerAddress,
      issuedDate: dto.issuedDate ? new Date(dto.issuedDate) : undefined,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      billingType: dto.billingType,
      packageAmount: dto.packageAmount,
      addonsAmount: dto.addonsAmount,
      discount: dto.discount,
      subtotal: dto.subtotal,
      vatEnabled: dto.vatEnabled,
      vatAmount: dto.vatAmount,
      totalAmount: dto.totalAmount,
      signatureUrl: dto.signatureUrl,
      supplierSnapshot: supplierSnapshot as any,
      version: { increment: 1 },
    };

    if (dto.packageId) {
      data.package = { connect: { id: dto.packageId } };
    }

    if (dto.items) {
      data.items = {
        deleteMany: {},
        create: dto.items.map((item, index) => ({
          type: item.type,
          description: item.description,
          descriptionTh: item.descriptionTh,
          qty: item.qty,
          unitPrice: item.unitPrice,
          amount: item.amount,
          sortOrder: item.sortOrder ?? index,
        })),
      };
    }

    if (dto.offers) {
      data.offerRecords = {
        deleteMany: {},
        create: dto.offers.map((offer) => ({
          specialOfferId: offer.specialOfferId,
          name: offer.name,
          nameTh: offer.nameTh,
          isCustom: offer.isCustom ?? false,
        })),
      };
    }

    const updated = await this.prisma.quotation.update({
      where: { id },
      data,
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        offerRecords: true,
        package: true,
        createdBy: {
          select: { id: true, name: true, email: true, signatureUrl: true },
        },
      },
    });

    // Regenerate PDF + update Drive file
    const driveMeta = await this.updateDrivePdf(updated);

    const final = await this.prisma.quotation.update({
      where: { id },
      data: {
        driveFileId: driveMeta.driveFileId,
        driveUrl: driveMeta.driveUrl,
        pdfFileSize: driveMeta.pdfFileSize,
      },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        offerRecords: true,
        package: true,
        createdBy: {
          select: { id: true, name: true, email: true, signatureUrl: true },
        },
      },
    });

    return {
      ...final,
      pdfGenerated: !!driveMeta.driveFileId,
      driveUploaded: !!driveMeta.driveUrl,
    };
  }

  async findAll(query: QuotationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.QuotationWhereInput = {};

    if (query.search) {
      where.OR = [
        { quotationNumber: { contains: query.search, mode: 'insensitive' } },
        { customerCompany: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.dateFrom || query.dateTo) {
      where.issuedDate = {};
      if (query.dateFrom) {
        (where.issuedDate as Prisma.DateTimeFilter).gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        (where.issuedDate as Prisma.DateTimeFilter).lte = new Date(query.dateTo);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          package: { select: { name: true } },
          createdBy: { select: { name: true } },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.quotation.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        offerRecords: true,
        package: true,
        createdBy: {
          select: { id: true, name: true, email: true, signatureUrl: true },
        },
      },
    });
    if (!quotation) {
      throw new NotFoundException(`Quotation ${id} not found`);
    }
    return quotation;
  }

  async getPdf(id: string): Promise<Buffer> {
    const quotation = await this.findOne(id);
    const pdfData = await this.buildPdfData(quotation);
    return this.pdfService.generateQuotationPdf(pdfData);
  }

  async getDriveLink(id: string) {
    const quotation = await this.findOne(id);
    return {
      driveFileId: quotation.driveFileId,
      driveUrl: quotation.driveUrl,
      pdfFileSize: quotation.pdfFileSize,
    };
  }

  async remove(id: string) {
    const existing = await this.prisma.quotation.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Quotation ${id} not found`);
    }

    // Clean up Drive file
    if (existing.driveFileId) {
      try {
        await this.googleDriveService.deleteFile(existing.driveFileId);
      } catch (error) {
        this.logger.warn(`Failed to delete Drive file ${existing.driveFileId}: ${error.message}`);
      }
    }

    return this.prisma.quotation.delete({ where: { id } });
  }

  async duplicate(id: string, userId: string) {
    const original = await this.findOne(id);
    const quotationNumber = await this.generateQuotationNumber();

    return this.prisma.quotation.create({
      data: {
        quotationNumber,
        version: 1,
        customerCompany: original.customerCompany,
        customerCompanyTh: original.customerCompanyTh,
        customerTaxId: original.customerTaxId,
        customerAddress: original.customerAddress,
        issuedDate: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        packageId: original.packageId,
        billingType: original.billingType,
        packageAmount: original.packageAmount,
        addonsAmount: original.addonsAmount,
        discount: original.discount,
        subtotal: original.subtotal,
        vatEnabled: original.vatEnabled,
        vatAmount: original.vatAmount,
        totalAmount: original.totalAmount,
        signatureUrl: original.signatureUrl,
        supplierSnapshot: (original as any).supplierSnapshot,
        createdById: userId,
        items: {
          create: original.items.map((item) => ({
            type: item.type,
            description: item.description,
            descriptionTh: item.descriptionTh,
            qty: item.qty,
            unitPrice: item.unitPrice,
            amount: item.amount,
            sortOrder: item.sortOrder,
          })),
        },
        offerRecords: {
          create: original.offerRecords.map((o) => ({
            specialOfferId: o.specialOfferId,
            name: o.name,
            nameTh: o.nameTh,
            isCustom: o.isCustom,
          })),
        },
      },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        offerRecords: true,
        package: true,
        createdBy: {
          select: { id: true, name: true, email: true, signatureUrl: true },
        },
      },
    });
  }
}
