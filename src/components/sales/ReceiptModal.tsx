import { useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Sale } from '@/hooks/useSales';
import { useLanguage } from '@/contexts/LanguageContext';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';


interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: Sale | null;
    customerName?: string;
    customerMobile?: string;
    receiptNo?: number;
    allSales?: Sale[];
    showLedger?: boolean;
}

export const ReceiptModal = ({ isOpen, onClose, sale, customerName, customerMobile, receiptNo, allSales, showLedger = false }: ReceiptModalProps) => {
    const { t, language } = useLanguage();
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const isMarathi = language === 'mr' || true; // Force Marathi layout primarily

    if (!sale) return null;

    // Ledger Logic
    const shouldUseLedger = showLedger && allSales && allSales.length > 0;

    let customerSales = shouldUseLedger && allSales
        ? allSales
            .filter(s => s.customer_id === sale.customer_id)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        : [sale];

    // Fallback if filter returns empty (should rarely happen but safe) or if allSales was empty array
    if (customerSales.length === 0) customerSales = [sale];

    const totalAmount = customerSales.reduce((sum, s) => sum + s.total_amount, 0);
    const paidAmount = customerSales.reduce((sum, s) => sum + s.amount_paid, 0);
    const balanceDue = totalAmount - paidAmount;

    const displayReceiptNo = receiptNo
        ? receiptNo.toString().padStart(4, '0')
        : sale.id.slice(0, 6).toUpperCase();

    const generateImage = async () => {
        if (!receiptRef.current) return null;

        try {
            // Clone the element to ensure full capture without scroll clipping
            const original = receiptRef.current;
            const clone = original.cloneNode(true) as HTMLElement;

            // Style the clone to force full height/width and avoid viewport constraints
            clone.style.position = 'fixed';
            clone.style.top = '-10000px';
            clone.style.left = '0'; // Keep left alignment
            clone.style.width = '380px'; // Force standard width for consistency
            clone.style.height = 'auto'; // Let it expand naturally
            clone.style.minHeight = '100px'; // Ensure basic height
            clone.style.zIndex = '-9999';
            clone.style.overflow = 'visible'; // Ensure nothing is hidden

            // Append to body
            document.body.appendChild(clone);

            // Wait a tick for styles to apply (sometimes needed for fonts/layout)
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(clone, {
                scale: 3, // High quality
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                windowWidth: original.scrollWidth,
                windowHeight: original.scrollHeight + 100, // Add buffer
                height: clone.offsetHeight + 10, // Explicit height
                width: clone.offsetWidth,
                scrollY: -window.scrollY // Reset scroll offset
            });

            // Cleanup
            document.body.removeChild(clone);

            return canvas;
        } catch (error) {
            console.error("Image generation failed:", error);
            toast.error("Failed to generate receipt image");
            return null;
        }
    };

    const handleDownloadJpg = async () => {
        setIsDownloading(true);
        toast.info(isMarathi ? "पावती तयार होत आहे..." : "Generating receipt...", { duration: 1000 });
        const canvas = await generateImage();
        if (canvas) {
            const image = canvas.toDataURL("image/jpeg", 0.9);
            const link = document.createElement('a');
            link.href = image;
            link.download = `Receipt_${customerName || 'Customer'}_${displayReceiptNo}.jpg`;
            link.click();
            toast.success(isMarathi ? "पावती डाउनलोड झाली!" : "Receipt downloaded!");
        }
        setIsDownloading(false);
    };



    const handleWhatsApp = async () => {
        if (!receiptRef.current) return;
        setIsDownloading(true);

        try {
            const canvas = await generateImage();
            if (!canvas) return;

            // Convert canvas to blob
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    setIsDownloading(false);
                    return;
                }

                const safeReceiptNo = displayReceiptNo.replace(/[^a-zA-Z0-9-]/g, '_');
                const fileName = `receipt_${safeReceiptNo}.png`;
                const file = new File([blob], fileName, { type: 'image/png' });

                const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

                if (isMobile && navigator.share) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: isMarathi ? 'विठुमाऊली वीट उत्पादक केद्र पावती' : 'BricksMate Receipt'
                        });
                        toast.success(isMarathi ? "शेअर केले!" : "Shared successfully!");
                    } catch (shareError) {
                        if ((shareError as Error).name !== 'AbortError') {
                            console.error('Share failed:', shareError);
                            await handleDesktopShare();
                        }
                    }
                } else {
                    await handleDesktopShare();
                }

                async function handleDesktopShare() {
                    const msg = encodeURIComponent(`${isMarathi ? 'पावती' : 'Receipt'} #${displayReceiptNo} - ${customerName || ''}`);
                    let phone = customerMobile || '';
                    phone = phone.replace(/\D/g, '');
                    if (phone.length === 10) phone = '91' + phone;
                    const url = phone
                        ? `https://web.whatsapp.com/send?phone=${phone}&text=${msg}`
                        : `https://web.whatsapp.com/send?text=${msg}`;

                    try {
                        await navigator.clipboard.write([
                            new ClipboardItem({
                                [blob!.type]: blob!
                            })
                        ]);

                        window.open(url, '_blank');
                        toast.success(isMarathi ? "इमेज कॉपी झाली! व्हॉट्सॲपवर पेस्ट करा (Ctrl+V)." : "Image Copied! Paste (Ctrl+V) in WhatsApp.", { duration: 5000 });

                    } catch (clipboardError) {
                        console.error("Clipboard failed, falling back to download", clipboardError);

                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob!);
                        link.download = fileName;
                        link.click();

                        window.open(url, '_blank');
                        toast.success(isMarathi ? "इमेज डाउनलोड झाली. कृपया व्हॉट्सॲपवर जोडा." : "Image Downloaded. Please attach on WhatsApp.", { duration: 5000 });
                    }
                }
                setIsDownloading(false);
            });

        } catch (error) {
            console.error('Error sharing:', error);
            toast.error(t('error'));
            setIsDownloading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-white text-black p-0 overflow-hidden max-h-[90vh] flex flex-col">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>{t('receipt')}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex justify-center">
                    {/* Receipt Container for Capture */}
                    <div
                        ref={receiptRef}
                        className="bg-white p-4 sm:p-6 shadow-xl border border-gray-200 w-full max-w-[380px] font-sans relative mx-auto"
                        style={{ aspectRatio: 'auto' }}
                    >
                        {/* Header Image */}
                        {/* Header Image Replacement */}
                        <div className="mb-4 text-center">
                            <h1 className="text-2xl font-black text-[#e11d48] uppercase tracking-widest border-b-4 border-[#e11d48] inline-block pb-1">विठुमाऊली वीट उत्पादक केद्र</h1>
                        </div>

                        {/* Address & Contact (Below Image) */}
                        <div className="text-center mt-2">
                            <div className="text-sm font-medium text-gray-600">
                                {isMarathi ? 'मु. पो. कोळवाडी, ता. शिरुर' : 'At Post Kolwadi, Tq. Shirur'}
                            </div>
                            <div className="text-sm font-bold mt-1 text-black tracking-wide">
                                9921915464 <span className="text-gray-400 mx-1">|</span> 9075966464
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-full h-px bg-gray-200 my-2"></div>

                        {/* Customer & Meta Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                            <div className="space-y-1">
                                <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">ग्राहक (Billed To)</div>
                                <div className="font-bold text-lg text-black leading-tight capitalize">
                                    {customerName || 'रोखी (Cash)'}
                                </div>
                                {customerMobile && <div className="text-gray-600 font-mono text-xs">{customerMobile}</div>}
                            </div>
                            <div className="text-right space-y-1">
                                <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">पावती क्र. (Receipt No)</div>
                                <div className="font-bold text-black font-mono">#{displayReceiptNo}</div>
                                <div className="text-xs text-gray-500 mt-1">दिनांक (Date)</div>
                                <div className="font-medium">{format(new Date(sale.date), 'dd/MM/yyyy')}</div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="mb-6">
                            <div className="grid grid-cols-12 bg-gray-50 rounded-t-md border border-gray-100 py-2 px-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                <div className="col-span-5 text-left">{isMarathi ? 'तपशील' : 'ITEM'}</div>
                                <div className="col-span-3 text-right">{isMarathi ? 'नग' : 'QTY'}</div>
                                <div className="col-span-4 text-right">{isMarathi ? 'रक्कम' : 'TOTAL'}</div>
                            </div>
                            <div className="border-x border-b border-gray-100 divide-y divide-gray-100">
                                {customerSales.map((item, index) => (
                                    <div key={item.id} className="grid grid-cols-12 py-3 px-3 text-sm text-black items-start">
                                        <div className="col-span-5 text-left">
                                            <div className="font-medium">{isMarathi ? 'विटा' : 'Bricks'}</div>
                                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">{format(new Date(item.date), 'dd/MM/yy')}</div>
                                        </div>
                                        <div className="col-span-3 text-right font-mono text-gray-700">
                                            {item.quantity}
                                            <div className="text-[10px] text-gray-400">@{item.rate_per_brick}</div>
                                        </div>
                                        <div className="col-span-4 text-right font-bold text-black">{item.total_amount}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totals Section */}
                        <div className="mt-6">
                            <div className="w-full space-y-2">
                                <div className="flex justify-between text-sm text-gray-600 px-2">
                                    <span>{isMarathi ? 'एकूण रक्कम' : 'Sub Total'}</span>
                                    <span className="font-medium">₹{totalAmount}</span>
                                </div>
                                <div className="flex justify-between text-sm text-green-700 px-2">
                                    <span>{isMarathi ? 'जमा रक्कम' : 'Paid Amount'}</span>
                                    <span className="font-medium">- ₹{paidAmount}</span>
                                </div>
                                <div className="flex justify-between bg-red-50 p-2 rounded-md items-center border border-red-100 mt-2 shadow-sm">
                                    <span className="text-red-800 font-bold text-sm uppercase mr-4">{isMarathi ? 'बाकी रक्कम' : 'BALANCE DUE'}</span>
                                    <span className="text-red-700 font-extrabold text-xl whitespace-nowrap">₹{balanceDue}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Signature */}
                        <div className="mt-8 pt-2 flex justify-between items-end">
                            <div className="text-[10px] text-gray-400 leading-tight">
                                ही संगणकीकृत पावती आहे.<br />
                                शिरूर न्यायक्षेत्राच्या अधीन.
                            </div>
                            <div className="text-center">
                                {/* <img src="/signature.png" className="h-8 mx-auto opacity-80" /> */}
                                <div className="h-8"></div>
                                <div className="border-t border-gray-300 w-32 mx-auto"></div>
                                <div className="text-xs font-bold text-gray-800 mt-1">
                                    {isMarathi ? 'प्रो. उद्धव वाघुलकर' : 'Prop. Uddhav Waghulkar'}
                                </div>
                                <div className="text-[9px] text-red-600 font-medium uppercase tracking-wider">
                                    {isMarathi ? 'अधिकृत स्वाक्षरी' : 'AUTHORIZED SIGNATORY'}
                                </div>
                            </div>
                        </div>

                        {/* Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
                            <img src="/mauli-logo.png" className="w-1/2 grayscale" />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 border-t bg-white flex-col gap-2 sm:flex-row">
                    {shouldUseLedger ? (
                        <div className="flex w-full gap-2">
                            <Button onClick={handleDownloadJpg} variant="outline" className="flex-1" disabled={isDownloading}>
                                {isDownloading ? t('loadingText') : (
                                    <>
                                        <Download className="w-4 h-4 mr-2" />
                                        {t('downloadJpg')}
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex w-full gap-2">
                            <Button onClick={handleWhatsApp} className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white" disabled={isDownloading}>
                                {isDownloading ? t('loadingText') : (
                                    <>
                                        <Share2 className="w-4 h-4 mr-2" />
                                        {t('shareWhatsapp')}
                                    </>
                                )}
                            </Button>
                            <Button onClick={handleDownloadJpg} variant="outline" className="flex-1" disabled={isDownloading}>
                                {isDownloading ? t('loadingText') : (
                                    <>
                                        <Download className="w-4 h-4 mr-2" />
                                        {t('downloadJpg')}
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

