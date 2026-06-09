'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuotation } from '@/hooks/use-quotations';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';
export default function PreviewQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { quotation, isLoading } = useQuotation(id);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;

    const fetchPdf = async () => {
      try {
        const response = await api.get(`/quotations/${id}/pdf`, {
          responseType: 'blob',
        });
        objectUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        setPdfUrl(objectUrl);
        setPdfError(false);
      } catch {
        setPdfError(true);
      }
    };

    fetchPdf();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/quotations/${deleteId}`);
      router.push('/quotations');
    } finally {
      setDeleting(false);
    }
  };

  const downloadPdf = async () => {
    setPdfLoading(true);
    try {
      const response = await api.get(`/quotations/${id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${quotation?.quotationNumber || 'quotation'}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setPdfLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatCurrency = (n: number) =>
    `฿${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (isLoading || !quotation) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/quotations')}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{quotation.quotationNumber}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadPdf} disabled={pdfLoading}>
            {pdfLoading ? (
              <Loader2 className="size-3.5 mr-1 animate-spin" />
            ) : (
              <Download className="size-3.5 mr-1" />
            )}
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/quotations/${id}/edit`)}
          >
            <Pencil className="size-3.5 mr-1" />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteId(id)}>
            <Trash2 className="size-3.5 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* PDF Embed */}
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-lg" style={{ height: '600px' }}>
          {pdfError ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <AlertCircle className="size-10" />
              <p className="text-sm font-medium">Unable to load PDF preview.</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title={`Quotation ${quotation.quotationNumber}`}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Prepared For</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-semibold">{quotation.customerCompany}</p>
            {quotation.customerCompanyTh && (
              <p className="text-muted-foreground">{quotation.customerCompanyTh}</p>
            )}
            {quotation.customerTaxId && (
              <p className="text-muted-foreground">Tax ID: {quotation.customerTaxId}</p>
            )}
            {quotation.customerAddress && (
              <p className="text-muted-foreground">{quotation.customerAddress}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Document Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Issued Date</span>
              <span>{formatDate(quotation.issuedDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valid Until</span>
              <span>{formatDate(quotation.validUntil)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Package</span>
              <span>{quotation.package.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Billing</span>
              <span>{quotation.billingType === 'MONTHLY' ? 'Monthly' : 'Yearly'}</span>
            </div>
            {quotation.pdfFileSize && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">File Size</span>
                <span>{(Number(quotation.pdfFileSize) / 1024).toFixed(1)} KB</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Description</th>
                  <th className="text-center px-3 py-2 font-medium w-16">Qty</th>
                  <th className="text-right px-3 py-2 font-medium w-28">Unit Price</th>
                  <th className="text-right px-3 py-2 font-medium w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quotation.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">{item.type}</Badge>
                        <span>{item.description}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center">{item.qty}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(Number(item.unitPrice))}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(Number(item.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Package Amount</span>
            <span>{formatCurrency(quotation.packageAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Add-ons</span>
            <span>{formatCurrency(quotation.addonsAmount)}</span>
          </div>
          {Number(quotation.discount) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-{formatCurrency(quotation.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium">
            <span>Subtotal</span>
            <span>{formatCurrency(quotation.subtotal)}</span>
          </div>
          {quotation.vatEnabled && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT 7%</span>
              <span>{formatCurrency(quotation.vatAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total Amount</span>
            <span>{formatCurrency(quotation.totalAmount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Quotation</DialogTitle>
            <DialogDescription>
              This quotation and its PDF will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
