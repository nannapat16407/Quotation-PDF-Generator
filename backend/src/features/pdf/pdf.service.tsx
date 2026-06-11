import { Injectable, Logger } from '@nestjs/common';
import { renderToBuffer } from '@react-pdf/renderer';
import { Font } from '@react-pdf/renderer';
import * as path from 'path';
import * as fs from 'fs';
import {
  QuotationPdfDocument,
  QuotationPdfData,
} from './templates/quotation-pdf';

// Resolve the PDF module's asset directory for fonts and images.
// nest-cli.json copies assets to dist/features/pdf/ (stripping src/ prefix).
// But compiled JS may land at dist/src/features/pdf/ when TypeScript infers
// rootDir from the project root (triggered by prisma.config.ts at root level).
// This normalises the path when running from dist/ so assets are found correctly.
const pdfBaseDir = __dirname.includes(`${path.sep}dist${path.sep}`)
  ? __dirname.replace(/[/\\]src[/\\]features[/\\]/, '/features/')
  : __dirname;

const fontsDir = path.resolve(pdfBaseDir, 'fonts');

Font.register({
  family: 'Sarabun',
  fonts: [
    { src: path.join(fontsDir, 'Sarabun-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontsDir, 'Sarabun-Bold.ttf'), fontWeight: 700 },
    { src: path.join(fontsDir, 'Sarabun-Italic.ttf'), fontWeight: 400, fontStyle: 'italic' },
    { src: path.join(fontsDir, 'Sarabun-BoldItalic.ttf'), fontWeight: 700, fontStyle: 'italic' },
  ],
});

const logoPath = path.resolve(pdfBaseDir, 'assets', 'superhr.png');
const logoBase64 = fs.existsSync(logoPath)
  ? `data:image/png;base64,${fs.readFileSync(logoPath).toString('base64')}`
  : null;

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generateQuotationPdf(quotation: QuotationPdfData): Promise<Buffer> {
    this.logger.log(`Generating PDF for quotation ${quotation.quotationNumber}`);
    const buffer = await renderToBuffer(
      <QuotationPdfDocument data={quotation} logoSrc={logoBase64} />,
    );
    this.logger.log(`PDF generated: ${buffer.length} bytes`);
    return buffer;
  }
}
