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
}

export const ReceiptModal = ({ isOpen, onClose, sale, customerName, customerMobile }: ReceiptModalProps) => {
    const { t, language } = useLanguage();
    const receiptRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const isMarathi = language === 'mr' || true; // Force Marathi layout primarily

    if (!sale) return null;

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
            clone.style.width = `${original.offsetWidth}px`; // Match original width
            clone.style.height = 'auto'; // Let it expand naturally
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
            link.download = `Receipt_${customerName || 'Customer'}_${sale.id.slice(0, 6)}.jpg`;
            link.click();
            toast.success(isMarathi ? "पावती डाउनलोड झाली!" : "Receipt downloaded!");
        }
        setIsDownloading(false);
    };

    const handleWhatsApp = async () => {
        setIsDownloading(true);
        toast.loading(isMarathi ? "व्हॉट्सअँप शेअर तयार करत आहे..." : "Preparing WhatsApp share...");
        try {
            const canvas = await generateImage();
            if (!canvas) throw new Error("Canvas generation failed");

            canvas.toBlob(async (blob) => {
                if (!blob) {
                    toast.error("Failed to create image.");
                    setIsDownloading(false);
                    return;
                }

                // Try Web Share API first (Mobile)
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'receipt.jpg', { type: 'image/jpeg' })] })) {
                    try {
                        const file = new File([blob], `Receipt_${sale.id.slice(0, 6)}.jpg`, { type: 'image/jpeg' });
                        await navigator.share({
                            files: [file],
                            title: 'Payment Receipt',
                            text: `Payment Receipt for ${customerName}`,
                        });
                        toast.dismiss();
                    } catch (shareError) {
                        console.error('Share dismissed or failed', shareError);
                        toast.dismiss();
                        // If share failed/cancelled, do nothing or fallback?
                        // Usually user cancelled styling.
                    }
                } else {
                    // Fallback (Desktop): Download + WhatsApp Web Text
                    const image = canvas.toDataURL("image/jpeg", 0.9);
                    const link = document.createElement('a');
                    link.href = image;
                    link.download = `Receipt_For_WhatsApp_${sale.id.slice(0, 6)}.jpg`;
                    link.click();

                    toast.dismiss();
                    toast.success(isMarathi ? "फोटो डाउनलोड झाला! व्हॉट्सअँप उघडत आहे..." : "Image downloaded! Opening WhatsApp...", { duration: 3000 });

                    setTimeout(() => {
                        const message = isMarathi
                            ? `*माऊली वीट उत्पादक पावती*\nकृपया डाउनलोड केलेली पावती जोडा.\n\nदिनांक: ${format(new Date(sale.date), 'dd/MM/yyyy')}\nएकूण: ₹${sale.total_amount}`
                            : `*MAULI VIT UTPADAK Receipt*\nPlease attach the downloaded receipt.\n\nDate: ${format(new Date(sale.date), 'dd/MM/yyyy')}\nTotal: ₹${sale.total_amount}`;

                        const mobile = customerMobile ? `91${customerMobile.replace(/\D/g, '')}` : '';
                        const url = `https://wa.me/${mobile}?text=${encodeURIComponent(message)}`;
                        window.open(url, '_blank');
                    }, 1500);
                }
            }, 'image/jpeg', 0.9);

        } catch (error) {
            console.error("WhatsApp share failed:", error);
            toast.error("Could not share to WhatsApp");
        } finally {
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
                        className="bg-white p-6 shadow-xl border border-gray-200 w-full max-w-[380px] font-sans relative"
                        style={{ aspectRatio: 'auto' }}
                    >
                        {/* Header Image */}
                        <div className="mb-4">
                            <img src="/receipt-header.png" alt="Header" className="w-full h-auto object-contain rounded-t-sm" />

                            {/* Address & Contact (Below Image) */}
                            <div className="text-center mt-2">
                                <div className="text-sm font-medium text-gray-600">
                                    {isMarathi ? 'मु. पो. कोळवाडी, ता. शिरुर' : 'At Post Kolwadi, Tq. Shirur'}
                                </div>
                                <div className="text-sm font-bold mt-1 text-black tracking-wide">
                                    9921915464 <span className="text-gray-400 mx-1">|</span> 9075966464
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="w-full h-px bg-gray-200 my-2"></div>

                        {/* Customer & Meta Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                            <div className="space-y-1">
                                <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{isMarathi ? 'ग्राहक' : 'BILLED TO'}</div>
                                <div className="font-bold text-lg text-black leading-tight capitalize">
                                    {customerName || (isMarathi ? 'रोखी' : 'Cash')}
                                </div>
                                {customerMobile && <div className="text-gray-600 font-mono text-xs">{customerMobile}</div>}
                            </div>
                            <div className="text-right space-y-1">
                                <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{isMarathi ? 'पावती क्र.' : 'RECEIPT NO.'}</div>
                                <div className="font-bold text-black font-mono">#{sale.id.slice(0, 6).toUpperCase()}</div>
                                <div className="text-xs text-gray-500 mt-1">{isMarathi ? 'दिनांक' : 'DATE'}</div>
                                <div className="font-medium">{format(new Date(sale.date), 'dd/MM/yyyy')}</div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="mb-6">
                            <div className="grid grid-cols-12 bg-gray-50 rounded-t-md border border-gray-100 py-2 px-3 text-xs font-bold text-gray-600 uppercase tracking-wider">
                                <div className="col-span-6 text-left">{isMarathi ? 'तपशील' : 'ITEM'}</div>
                                <div className="col-span-2 text-right">{isMarathi ? 'नग' : 'QTY'}</div>
                                <div className="col-span-2 text-right">{isMarathi ? 'दर' : 'RATE'}</div>
                                <div className="col-span-2 text-right">{isMarathi ? 'रक्कम' : 'TOTAL'}</div>
                            </div>
                            <div className="grid grid-cols-12 border-x border-b border-gray-100 py-3 px-3 text-sm text-black items-center">
                                <div className="col-span-6 text-left font-medium">{isMarathi ? 'विटा (स्टँडर्ड)' : 'Bricks (Standard)'}</div>
                                <div className="col-span-2 text-right font-mono text-gray-700">{sale.quantity}</div>
                                <div className="col-span-2 text-right font-mono text-gray-700">{sale.rate_per_brick}</div>
                                <div className="col-span-2 text-right font-bold text-black">{sale.total_amount}</div>
                            </div>
                        </div>

                        {/* Totals Section */}
                        <div className="flex justify-end mb-8">
                            <div className="w-2/3 space-y-2">
                                <div className="flex justify-between text-sm text-gray-600 px-2">
                                    <span>{isMarathi ? 'एकूण रक्कम' : 'Sub Total'}</span>
                                    <span className="font-medium">₹{sale.total_amount}</span>
                                </div>
                                <div className="flex justify-between text-sm text-green-700 px-2">
                                    <span>{isMarathi ? 'जमा रक्कम' : 'Paid Amount'}</span>
                                    <span className="font-medium">- ₹{sale.amount_paid}</span>
                                </div>
                                <div className="flex justify-between bg-red-50 p-2 rounded-md items-center border border-red-100 mt-2">
                                    <span className="text-red-800 font-bold text-sm uppercase">{isMarathi ? 'बाकी रक्कम' : 'BALANCE DUE'}</span>
                                    <span className="text-red-700 font-extrabold text-xl">₹{sale.total_amount - sale.amount_paid}</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Signature */}
                        <div className="mt-8 pt-2 flex justify-between items-end">
                            <div className="text-[10px] text-gray-400 leading-tight">
                                This is a computer generated receipt.<br />
                                Subject to Shirur Jurisdiction.
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

                <DialogFooter className="p-4 bg-white border-t gap-3 flex-col sm:flex-row">
                    <Button variant="outline" onClick={handleDownloadJpg} disabled={isDownloading} className="flex-1 h-11 border-gray-300">
                        {isDownloading ? <span className="animate-spin mr-2">⏳</span> : <Download className="w-4 h-4 mr-2" />}
                        {isMarathi ? 'गॅलरीत सेव करा' : 'Save to Gallery'}
                    </Button>

                    <Button onClick={handleWhatsApp} className="flex-1 h-11 bg-[#25D366] hover:bg-[#128C7E] text-white shadow-md">
                        <Share2 className="w-4 h-4 mr-2" />
                        {isMarathi ? 'व्हॉट्सअँप वर पाठवा' : 'Share on WhatsApp'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
