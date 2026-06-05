import { Module } from '@nestjs/common';
import { QuotationController } from './quotation.controller';
import { QuotationService } from './quotation.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PdfModule } from '../pdf/pdf.module';
import { GoogleDriveModule } from '../../integrations/google-drive/google-drive.module';
import { SupplierModule } from '../supplier/supplier.module';

@Module({
  imports: [PrismaModule, PdfModule, GoogleDriveModule, SupplierModule],
  controllers: [QuotationController],
  providers: [QuotationService],
  exports: [QuotationService],
})
export class QuotationModule {}
