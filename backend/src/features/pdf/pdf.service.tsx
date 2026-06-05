import { Injectable, Logger } from '@nestjs/common';
import { renderToBuffer } from '@react-pdf/renderer';
import { Font } from '@react-pdf/renderer';
import * as path from 'path';
import {
  QuotationPdfDocument,
  QuotationPdfData,
} from './templates/quotation-pdf';

Font.register({
  family: 'Inter',
  src: path.resolve(process.cwd(), 'src', 'features', 'pdf', 'fonts', 'Inter.ttf'),
});

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generateQuotationPdf(quotation: QuotationPdfData): Promise<Buffer> {
    this.logger.log(`Generating PDF for quotation ${quotation.quotationNumber}`);
    const buffer = await renderToBuffer(<QuotationPdfDocument data={quotation} />);
    this.logger.log(`PDF generated: ${buffer.length} bytes`);
    return buffer;
  }
}
