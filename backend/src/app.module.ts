import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './features/auth/auth.module';
import { SupplierModule } from './features/supplier/supplier.module';
import { PackageModule } from './features/package/package.module';
import { SpecialOfferModule } from './features/special-offer/special-offer.module';
import { QuotationModule } from './features/quotation/quotation.module';
import { PdfModule } from './features/pdf/pdf.module';
import { GoogleDriveModule } from './integrations/google-drive/google-drive.module';
import { GoogleDriveSettingsModule } from './features/google-drive-settings/google-drive-settings.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env'],
    }),
    PrismaModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    SupplierModule,
    PackageModule,
    SpecialOfferModule,
    QuotationModule,
    PdfModule,
    GoogleDriveModule,
    GoogleDriveSettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
