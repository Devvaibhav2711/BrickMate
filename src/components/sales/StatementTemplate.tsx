import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { Sale } from '@/hooks/useSales';

interface StatementTemplateProps {
    customerName: string;
    customerMobile?: string;
    customerAddress?: string;
    transactions: any[];
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
    receiptNo?: string;
}

export const StatementTemplate = forwardRef<HTMLDivElement, StatementTemplateProps>(({
    customerName,
    customerMobile,
    customerAddress,
    transactions,
    totalAmount,
    paidAmount,
    balanceDue,
    receiptNo
}, ref) => {

    // Number to Marathi Words (Basic implementation for big numbers)
    const numberToMarathiWords = (num: number): string => {
        // Simplified fallback - for a full parser we'd need a big library or complex function.
        // For now, returning numeric representation in Marathi context or generic text.
        // Or we can leave it dynamic or simple.
        // Let's us a placeholder or simple format.
        return `${formatCurrency(num)} (अक्षरी)`;
    };

    return (
        <div ref={ref} className="w-full max-w-[210mm] print:w-full min-h-[297mm] bg-white text-black p-0 mx-auto relative font-sans box-border border-2 border-slate-900" style={{ padding: '0' }}>
            {/* Header Section */}
            <div className="flex justify-between items-start p-2 md:p-8 print:p-8 pb-4 relative">
                {/* Orange/Blue Decorative Top Bar is managed via borders/bg or absolute div */}
                <div className="absolute top-0 left-0 w-full h-4 bg-slate-800" style={{ backgroundColor: '#1e293b', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}></div>
                <div className="absolute top-4 left-0 w-2/3 h-4 bg-orange-500 rounded-br-3xl" style={{ backgroundColor: '#f97316', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}></div>

                <div className="mt-8 w-full">
                    <div className="flex justify-between items-start">
                        {/* Logo / Company Name - Left Aligned */}
                        <div className="text-left">
                            <h1 className="text-2xl md:text-5xl print:text-5xl font-extrabold text-slate-900 tracking-tight">माऊली</h1>
                            <h2 className="text-lg md:text-2xl print:text-2xl font-bold text-slate-700 whitespace-nowrap">वीट उत्पादक केंद्र</h2>
                        </div>

                        {/* Address */}
                        <div className="text-right text-xs md:text-sm print:text-sm text-gray-600">
                            <p className="font-bold text-slate-800 text-base">उद्धव वाघुलकर</p>
                            <p className="font-bold mt-1">मो. 9921915464 | 9075966464</p>
                            <p className="mt-1">मु. पो. कोळवाडी, ता. शिरुर, जि. बीड</p>
                        </div>
                    </div>

                    {/* Invoice Label */}
                    <div className="flex justify-center mt-6">
                        <div className="bg-orange-500 text-white px-8 md:px-12 print:px-12 py-1 md:py-2 print:py-2 rounded-full font-bold text-sm md:text-lg print:text-lg shadow-sm" style={{ backgroundColor: '#f97316', color: 'white', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                            पावती / स्टेटमेंट
                        </div>
                    </div>
                </div>
            </div>

            {/* Meta Data & Customer */}
            <div className="px-2 md:px-8 print:px-8 py-2">
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <div className="flex items-end gap-2 mb-2 text-xs md:text-base print:text-base">
                            <span className="font-bold text-slate-800 min-w-[50px] md:min-w-[60px] print:min-w-[60px]">पावती क्र.:</span>
                            <span className="px-2 min-w-[80px] md:min-w-[100px] print:min-w-[100px]">{receiptNo || 'Total-LGR'}</span>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-end gap-2 mb-2 text-xs md:text-base print:text-base">
                            <span className="font-bold text-slate-800">दिनांक:</span>
                            <span className="px-2 min-w-[90px] md:min-w-[120px] print:min-w-[120px]">{format(new Date(), 'dd/MM/yyyy')}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2 text-xs md:text-base print:text-base">
                    <div className="flex items-end gap-2">
                        <span className="font-bold text-slate-800 min-w-[50px] md:min-w-[60px] print:min-w-[60px]">नाव:</span>
                        <span className="px-2 flex-grow text-sm md:text-lg print:text-lg">{customerName}</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="font-bold text-slate-800 min-w-[50px] md:min-w-[60px] print:min-w-[60px]">पत्ता:</span>
                        <span className="px-2 flex-grow">{customerAddress || 'Please update address'}</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="font-bold text-slate-800 min-w-[50px] md:min-w-[60px] print:min-w-[60px]">मोबाईल:</span>
                        <span className="px-2 flex-grow">{customerMobile?.replace(/^\+91/, '')}</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="px-2 md:px-8 print:px-8 mt-6">
                <table className="w-full border-collapse border border-black">
                    <thead>
                        <tr className="bg-slate-800 text-white text-xs md:text-base print:text-base border-b border-black" style={{ backgroundColor: '#1e293b', color: 'white', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
                            <th className="py-3 px-1 md:px-2 print:px-2 border-r border-black w-[30px] md:w-[60px] print:w-[60px] text-center">अ.क्र.</th>
                            <th className="py-3 px-1 md:px-2 print:px-2 border-r border-black text-left">तपशील (Description)</th>
                            <th className="py-3 px-1 md:px-2 print:px-2 border-r border-black w-[40px] md:w-[80px] print:w-[80px] text-center">नग</th>
                            <th className="py-3 px-1 md:px-2 print:px-2 border-r border-black w-[50px] md:w-[100px] print:w-[100px] text-center">दर</th>
                            <th className="py-3 px-1 md:px-2 print:px-2 w-[70px] md:w-[120px] print:w-[120px] text-center">रक्कम</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {transactions.map((tx, index) => (
                            <tr key={index} className="border-b border-black">
                                <td className="py-2 px-2 border-r border-black text-center font-medium">{index + 1}</td>
                                <td className="py-2 px-2 border-r border-black">
                                    <div className="font-semibold text-slate-700">{tx.details}</div>
                                    <div className="text-xs text-gray-500">{format(new Date(tx.date), 'dd/MM/yyyy')}</div>
                                </td>
                                <td className="py-2 px-2 border-r border-black text-center">{tx.quantity || '-'}</td>
                                <td className="py-2 px-2 border-r border-black text-center text-lg">{tx.rate || '-'}</td>
                                <td className="py-2 px-2 text-center font-bold text-slate-800">
                                    {tx.debit > 0 ? formatCurrency(tx.debit) : (tx.credit > 0 ? `-${formatCurrency(tx.credit)}` : '-')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Use Flex-grow or Spacer to push footer down could be complex in A4, usually fixed positioning or margin-top auto works */}
            <div className="px-2 md:px-8 print:px-8 mt-8">
                <div className="flex justify-between items-start">
                    <div className="w-1/2 pr-4">
                        <div className="mb-2 font-bold text-slate-800 text-xs md:text-base print:text-base">अक्षरी (In Words):</div>
                        <div className="text-xs md:text-sm print:text-sm text-gray-600 italic border-b border-gray-300 pb-1">
                            {/* Placeholder for now */}
                            {formatCurrency(balanceDue)} only.
                        </div>
                    </div>
                    <div className="w-1/2 pl-4">
                        <div className="border border-slate-800 rounded-sm overflow-hidden text-xs md:text-base print:text-base">
                            <div className="flex justify-between border-b border-slate-300 p-2">
                                <span className="font-semibold">एकूण रक्कम (Total):</span>
                                <span className="font-bold">{formatCurrency(totalAmount)}</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-300 p-2">
                                <span className="font-semibold">जमा (Paid):</span>
                                <span className="font-bold text-green-600">{formatCurrency(paidAmount)}</span>
                            </div>
                            <div className="flex justify-between bg-slate-100 p-2">
                                <span className="font-bold text-slate-900">बाकी (Due):</span>
                                <span className="font-bold text-orange-600">{formatCurrency(balanceDue)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Signatures */}
            <div className="absolute bottom-0 left-0 w-full">
                <div className="px-4 md:px-12 print:px-12 pb-12 flex justify-between items-end text-xs md:text-base print:text-base">
                    <div className="text-center">
                        <div className="border-t-2 border-dashed border-gray-400 w-24 md:w-40 print:w-40 mb-2"></div>
                        <span className="font-bold text-slate-700">स्वीकारणारा (Receiver)</span>
                    </div>
                    <div className="text-center">
                        <div className="border-t-2 border-dashed border-gray-400 w-24 md:w-40 print:w-40 mb-2"></div>
                        <span className="font-bold text-slate-700">अधिकृत स्वाक्षरी (Authorized)</span>
                    </div>
                </div>
                {/* Decorative Bottom Bar */}
                <div className="w-full h-4 bg-slate-800 flex">
                    <div className="h-full w-1/3 bg-orange-500 rounded-tr-3xl"></div>
                </div>
            </div>
        </div>
    );
});

StatementTemplate.displayName = "StatementTemplate";
