import React, { useRef } from 'react';
import { Invoice, Business } from '../../types';
import { Printer, Share2, X, Check, QrCode } from 'lucide-react';

interface InvoiceReceiptModalProps {
  invoice: Invoice;
  business: Business;
  onClose: () => void;
  onNewSale: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  invoice,
  business,
  onClose,
  onNewSale,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  // Trigger system print dialog styled for thermal receipt
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Bill Sharing Generator
  const handleWhatsAppShare = () => {
    const phone = invoice.customerPhone ? invoice.customerPhone.replace(/[^0-9]/g, '') : '';
    
    // Format invoice text
    let text = `*${business.name}*\n`;
    text += `${business.address || ''}\n`;
    text += `Phone: ${business.phone || ''}\n`;
    text += `--------------------------------\n`;
    text += `*INVOICE: ${invoice.invoiceNumber}*\n`;
    text += `Date: ${new Date(invoice.createdAt).toLocaleDateString()} ${new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n`;
    text += `Customer: *${invoice.customerName}*\n`;
    text += `Billed by: ${invoice.userName}\n`;
    text += `--------------------------------\n`;
    text += `*ITEMS:*\n`;

    invoice.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.productName}\n`;
      text += `   ${item.quantity} ${item.unit} x ${business.currencySymbol}${item.unitPrice} = *${business.currencySymbol}${item.total}*\n`;
    });

    text += `--------------------------------\n`;
    text += `Subtotal: ${business.currencySymbol} ${invoice.subtotal.toLocaleString()}\n`;
    if (invoice.billDiscountAmount > 0) {
      text += `Discount: -${business.currencySymbol} ${invoice.billDiscountAmount.toLocaleString()}\n`;
    }
    text += `*GRAND TOTAL: ${business.currencySymbol} ${invoice.grandTotal.toLocaleString()}*\n`;
    text += `Paid Amount: ${business.currencySymbol} ${invoice.paidAmount.toLocaleString()}\n`;
    if (invoice.dueAmount > 0) {
      text += `*REMAINING DUE: ${business.currencySymbol} ${invoice.dueAmount.toLocaleString()}*\n`;
    }
    text += `Payment Method: ${invoice.paymentMethod}\n`;
    text += `--------------------------------\n`;
    if (business.invoiceFooterNote) {
      text += `${business.invoiceFooterNote}\n`;
    }

    const encoded = encodeURIComponent(text);
    const targetUrl = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    
    // Avoid popup blocking with anchor click
    const link = document.createElement('a');
    link.href = targetUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  // QR code image URL generator (standard open API)
  const qrData = business.paymentIdentifier
    ? `upi://pay?pa=${encodeURIComponent(business.paymentIdentifier)}&pn=${encodeURIComponent(business.name)}&am=${invoice.dueAmount > 0 ? invoice.dueAmount : invoice.grandTotal}&cu=${business.currency}`
    : `Invoice: ${invoice.invoiceNumber} | Total: ${invoice.grandTotal} | ${business.name}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 print:border-none print:shadow-none print:p-0 print:w-full print:max-w-none">
        {/* Header Action Bar (Hidden during print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Check className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Sale Completed!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Invoice {invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Buttons (Print, WhatsApp) */}
        <div className="mt-4 grid grid-cols-2 gap-2 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 px-3 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition active:scale-98 dark:bg-indigo-600 dark:hover:bg-indigo-700"
          >
            <Printer className="h-4 w-4" />
            <span>PRINT RECEIPT</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition active:scale-98"
          >
            <Share2 className="h-4 w-4" />
            <span>WHATSAPP BILL</span>
          </button>
        </div>

        {/* Printable Thermal Receipt Paper */}
        <div
          ref={receiptRef}
          className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-900 shadow-inner dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 print:border-none print:bg-white print:p-2 print:text-black"
        >
          {/* Business Header */}
          <div className="text-center space-y-0.5 pb-3 border-b border-dashed border-slate-300 dark:border-slate-700 print:border-black">
            <h2 className="text-base font-bold uppercase tracking-wider">{business.name}</h2>
            {business.address && <p className="text-[11px] text-slate-600 dark:text-slate-400 print:text-black">{business.address}</p>}
            {business.phone && <p className="text-[11px] text-slate-600 dark:text-slate-400 print:text-black">Phone: {business.phone}</p>}
            {business.taxNumber && <p className="text-[10px] text-slate-500 dark:text-slate-400 print:text-black">Tax Reg: {business.taxNumber}</p>}
          </div>

          {/* Invoice Meta */}
          <div className="py-2.5 text-[11px] space-y-1 border-b border-dashed border-slate-300 dark:border-slate-700 print:border-black">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 print:text-black">Invoice #:</span>
              <span className="font-bold">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 print:text-black">Date:</span>
              <span>{new Date(invoice.createdAt).toLocaleDateString()} {new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 print:text-black">Customer:</span>
              <span className="font-semibold">{invoice.customerName}</span>
            </div>
            {invoice.customerPhone && invoice.customerPhone !== '0000000000' && (
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400 print:text-black">Phone:</span>
                <span>{invoice.customerPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400 print:text-black">Billed By:</span>
              <span>{invoice.userName}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-2.5 border-b border-dashed border-slate-300 dark:border-slate-700 print:border-black">
            <div className="grid grid-cols-12 font-bold text-[10px] text-slate-500 dark:text-slate-400 pb-1 print:text-black">
              <div className="col-span-6">ITEM</div>
              <div className="col-span-2 text-center">QTY</div>
              <div className="col-span-2 text-right">PRICE</div>
              <div className="col-span-2 text-right">TOTAL</div>
            </div>

            <div className="divide-y divide-dotted divide-slate-200 dark:divide-slate-800 print:divide-slate-300">
              {invoice.items.map((item) => (
                <div key={item.id} className="py-1 text-[11px]">
                  <div className="font-medium text-slate-900 dark:text-white print:text-black">{item.productName}</div>
                  <div className="grid grid-cols-12 text-slate-600 dark:text-slate-400 print:text-black text-[10px]">
                    <div className="col-span-6 text-[10px] text-slate-400">{item.sku}</div>
                    <div className="col-span-2 text-center">{item.quantity} {item.unit}</div>
                    <div className="col-span-2 text-right">{item.unitPrice}</div>
                    <div className="col-span-2 text-right font-bold text-slate-900 dark:text-white print:text-black">{item.total}</div>
                  </div>
                  {item.discountAmount > 0 && (
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      Item Discount: -{business.currencySymbol}{item.discountAmount}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="py-2.5 space-y-1 text-[11px] border-b border-dashed border-slate-300 dark:border-slate-700 print:border-black">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{business.currencySymbol} {invoice.subtotal.toLocaleString()}</span>
            </div>
            {invoice.billDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Bill Discount:</span>
                <span>-{business.currencySymbol} {invoice.billDiscountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-300 dark:border-slate-700 print:border-black">
              <span>GRAND TOTAL:</span>
              <span>{business.currencySymbol} {invoice.grandTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Paid Amount:</span>
              <span>{business.currencySymbol} {invoice.paidAmount.toLocaleString()}</span>
            </div>
            {invoice.dueAmount > 0 && (
              <div className="flex justify-between font-bold text-amber-600 dark:text-amber-400">
                <span>UDHAAR / DUE:</span>
                <span>{business.currencySymbol} {invoice.dueAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-[10px] text-slate-500 pt-1">
              <span>Payment Mode:</span>
              <span className="font-bold">{invoice.paymentMethod}</span>
            </div>
          </div>

          {/* QR Code for Payment or Verification */}
          <div className="py-3 text-center space-y-1.5 flex flex-col items-center justify-center">
            <img
              src={qrImageUrl}
              alt="Payment QR"
              className="h-28 w-28 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700"
            />
            {business.paymentIdentifier && (
              <div className="text-[10px] text-slate-600 dark:text-slate-400 print:text-black">
                Scan to Pay: <span className="font-bold text-slate-900 dark:text-white print:text-black">{business.paymentIdentifier}</span>
              </div>
            )}
          </div>

          {/* Footer Note */}
          {business.invoiceFooterNote && (
            <div className="text-center text-[10px] text-slate-500 dark:text-slate-400 pt-1 print:text-black">
              {business.invoiceFooterNote}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex gap-2 print:hidden">
          <button
            onClick={onNewSale}
            className="flex-1 rounded-2xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition active:scale-98 dark:shadow-none"
          >
            Start Next Sale
          </button>
          <button
            onClick={onClose}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
