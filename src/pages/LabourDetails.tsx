import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Phone,
    MapPin,
    Users,
    CreditCard,
    Wallet,
    TrendingUp,
    History,
    PlusCircle,
    Banknote
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLabourDetails } from '@/hooks/useLabourDetails';
import { FormattedNumberInput } from '@/components/shared/FormattedNumberInput';
import { useAddAdvance, useAddWagePayment, useUpdateLabour } from '@/hooks/useLabour';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
};

import { DateRangeFilter, DateRange } from '@/components/shared/DateRangeFilter';
import { format } from 'date-fns';

export const LabourDetails = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { data, isLoading, refetch } = useLabourDetails(id);
    const addAdvance = useAddAdvance();
    const addPayment = useAddWagePayment();
    const updateLabour = useUpdateLabour();

    const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });


    const [reasonType, setReasonType] = useState('giveAdvance');
    const [notes, setNotes] = useState('');
    const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

    if (isLoading || !data) return <PageLoader />;

    const { labour, transactions, stats } = data;

    const filteredTransactions = transactions.filter(tx => {
        if (!dateRange.from) return true;
        const txDate = new Date(tx.date);
        if (dateRange.to) {
            return txDate >= dateRange.from && txDate <= dateRange.to;
        }
        return txDate >= dateRange.from;
    });

    const isActive = labour.is_active !== false;

    const handleAddAdvance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !amount || (reasonType === 'Other' && !notes)) {
            toast.error(t('error') + ": All fields are required");
            return;
        }
        await addAdvance.mutateAsync({
            labour_id: id,
            amount: Number(amount),
            notes: reasonType === 'Other' ? notes : (reasonType === 'giveAdvance' ? t('advanceGiven') : t(reasonType as any)),
            date: advanceDate,
            worker_name: labour.name
        });
        setAmount('');
        setReasonType('giveAdvance');
        setNotes('');
        setIsAdvanceOpen(false);
        refetch();
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !amount || !notes) {
            toast.error(t('error') + ": All fields are required");
            return;
        }
        await addPayment.mutateAsync({
            labour_id: id,
            amount: Number(amount),
            notes,
            payment_date: paymentDate
        });
        setAmount('');
        setNotes('');
        setIsPaymentOpen(false);
        refetch();
    };

    const handleToggleArchive = async () => {
        if (!id) return;
        await updateLabour.mutateAsync({
            id,
            is_active: !isActive
        });
        setIsArchiveDialogOpen(false);
        if (isActive) {
            navigate(-1); // Go back if archiving
        }
    };

    const isPositiveBalance = stats.balance > 0; // Labour owes owner

    return (
        <div className="p-4 space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            {labour.name}

                        </h1>
                    </div>
                </div>


            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Profile Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            {t('profileDetails')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-muted-foreground">{t('mobileNumber')}</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Phone className="w-4 h-4 text-primary" />
                                    <span>{labour.mobile || 'N/A'}</span>
                                </div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">{t('workType')}</Label>
                                <div className="mt-1">
                                    <Badge variant="outline">{t(labour.work_type)}</Badge>
                                </div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">{t('adharNo')}</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <CreditCard className="w-4 h-4 text-primary" />
                                    <span>{labour.adhar_no || 'N/A'}</span>
                                </div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">{t('dailyWage')}</Label>
                                <div className="mt-1 font-semibold">₹{labour.daily_wage}</div>
                            </div>
                            <div className="col-span-2">
                                <Label className="text-muted-foreground">{t('address')}</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <MapPin className="w-4 h-4 text-primary" />
                                    <span>{labour.address || 'N/A'}</span>
                                </div>
                            </div>
                            {labour.family_members && (
                                <div className="col-span-2">
                                    <Label className="text-muted-foreground">{t('familyMembers')}</Label>
                                    <p className="mt-1 text-sm">{labour.family_members}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Financial Stats */}
                <div className="space-y-4">
                    <Card className={isPositiveBalance ? "border-red-200 bg-red-50/50" : "border-green-200 bg-green-50/50"}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {t('pendingPayments')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={`text-3xl font-bold ${isPositiveBalance ? "text-red-600" : "text-green-600"}`}>
                                {formatCurrency(Math.abs(stats.balance))}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                {isPositiveBalance
                                    ? t('toRecover')
                                    : t('payableToWorker')}
                            </p>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <Wallet className="w-4 h-4" />
                                    <span className="text-sm">{t('totalGiven')}</span>
                                </div>
                                <div className="text-xl font-bold">{formatCurrency(stats.totalGiven)}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-sm">{t('totalEarned')}</span>
                                </div>
                                <div className="text-xl font-bold">{formatCurrency(stats.totalEarned)}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="flex gap-3">
                        <Dialog open={isAdvanceOpen} onOpenChange={setIsAdvanceOpen}>
                            <DialogTrigger asChild>
                                <Button className="flex-1" variant="outline">
                                    <Banknote className="w-4 h-4 mr-2" />
                                    {t('giveAdvance')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] flex flex-col p-0 gap-0 overflow-hidden max-h-[90dvh]">
                                <DialogHeader className="px-6 py-4 border-b">
                                    <DialogTitle>{t('giveAdvance')} - {labour.name}</DialogTitle>
                                </DialogHeader>
                                <div className="flex-1 overflow-y-auto px-6 py-4">
                                    <form id="advance-form" onSubmit={handleAddAdvance} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>{t('date')}</Label>
                                            <Input type="date" value={advanceDate} onChange={e => setAdvanceDate(e.target.value)} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('amount')} (₹)</Label>
                                            <FormattedNumberInput required value={amount} onChange={(val) => setAmount(val.toString())} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('reason')}</Label>
                                            <Select value={reasonType} onValueChange={setReasonType}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={t('reason')} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="giveAdvance">{t('giveAdvance')}</SelectItem>
                                                    <SelectItem value="medical">{t('medical')}</SelectItem>
                                                    <SelectItem value="Other">{t('other')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {reasonType === 'Other' && (
                                            <div className="space-y-2">
                                                <Label>{t('notes')}</Label>
                                                <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notes')} />
                                            </div>
                                        )}
                                    </form>
                                </div>
                                <DialogFooter className="px-6 py-4 border-t bg-background sticky bottom-0 z-20">
                                    <Button type="submit" form="advance-form" className="w-full">{t('save')}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                            <DialogTrigger asChild>
                                <Button className="flex-1">
                                    <PlusCircle className="w-4 h-4 mr-2" />
                                    {t('payWage')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] flex flex-col p-0 gap-0 overflow-hidden max-h-[90dvh]">
                                <DialogHeader className="px-6 py-4 border-b">
                                    <DialogTitle>{t('payWage')} - {labour.name}</DialogTitle>
                                </DialogHeader>
                                <div className="flex-1 overflow-y-auto px-6 py-4">
                                    <form id="payment-form" onSubmit={handleAddPayment} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>{t('date')}</Label>
                                            <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('amount')} (₹)</Label>
                                            <FormattedNumberInput required value={amount} onChange={(val) => setAmount(val.toString())} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('notes')}</Label>
                                            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('notes')} />
                                        </div>
                                    </form>
                                </div>
                                <DialogFooter className="px-6 py-4 border-t bg-background sticky bottom-0 z-20">
                                    <Button type="submit" form="payment-form" className="w-full">{t('save')}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Production History */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {t('productionHistory')}
                </h3>
                <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">{t('date')}</th>
                                    <th className="h-12 px-4 text-right font-medium text-muted-foreground">{t('quantity')}</th>
                                    <th className="h-12 px-4 text-right font-medium text-muted-foreground">{t('rate')}</th>
                                    <th className="h-12 px-4 text-right font-medium text-muted-foreground">{t('total')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.production?.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-muted-foreground">{t('noData')}</td>
                                    </tr>
                                ) : (
                                    data.production?.map((prod: any) => (
                                        <tr key={prod.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 whitespace-nowrap">
                                                {new Date(prod.date).toLocaleDateString()}
                                                {prod.notes && <div className="text-xs text-muted-foreground">{prod.notes}</div>}
                                            </td>
                                            <td className="p-4 text-right font-medium">{prod.quantity}</td>
                                            <td className="p-4 text-right text-muted-foreground">₹{prod.rate_per_brick}</td>
                                            <td className="p-4 text-right font-bold text-green-600">
                                                {formatCurrency((prod.quantity || 0) * (prod.rate_per_brick || 0))}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <History className="w-5 h-5" />
                        {t('transactionHistory')}
                    </h3>
                    <DateRangeFilter dateRange={dateRange} setDateRange={setDateRange} />
                </div>
                <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 border-b">
                                <tr>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">{t('date')}</th>
                                    <th className="h-12 px-4 text-left font-medium text-muted-foreground">{t('description')}</th>
                                    <th className="h-12 px-4 text-right font-medium text-muted-foreground">{t('debitGiven')}</th>
                                    <th className="h-12 px-4 text-right font-medium text-muted-foreground">{t('creditEarned')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-4 text-center text-muted-foreground">{t('noTransactions')}</td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map((tx) => (
                                        <tr key={tx.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 whitespace-nowrap">
                                                {format(new Date(tx.date), 'dd MMMM yyyy')}
                                            </td>
                                            <td className="p-4 font-medium">
                                                {(tx.description === 'Uchal Dya' || tx.description === 'Give Advance' || tx.description === 'Advance Payment' || tx.description === t('giveAdvance'))
                                                    ? t('advanceGiven')
                                                    : tx.description
                                                }
                                            </td>
                                            <td className="p-4 text-right text-red-600 font-medium whitespace-nowrap">
                                                {tx.isDebit ? formatCurrency(tx.amount) : '-'}
                                            </td>
                                            <td className="p-4 text-right text-green-600 font-medium whitespace-nowrap">
                                                {!tx.isDebit ? formatCurrency(tx.amount) : '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabourDetails;
