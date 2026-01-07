

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Edit,
    Trash2,
    Plus,
    Smartphone,
    MapPin,
    IndianRupee,
    Users,
    ShoppingCart,
    Hammer,
    Receipt,
    Share2,
    Wallet,
    FileText
} from 'lucide-react';
import { WorkerHistorySheet } from '@/components/admin/WorkerHistorySheet';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { FormattedNumberInput } from '@/components/shared/FormattedNumberInput';
import { toast } from 'sonner';

// Hooks
import { useCustomers, useDeleteCustomer, useUpdateCustomer, Customer } from '@/hooks/useCustomers';
import { useAllCustomerPayments } from '@/hooks/useCustomerPayments';
import { AddPaymentSheet } from '@/components/sales/AddPaymentSheet';
import { useSales, useDeleteSale, useUpdateSale, Sale } from '@/hooks/useSales';
import { useLabour, useDeleteLabour, useUpdateLabour, Labour } from '@/hooks/useLabour';
import { useExpenses, useDeleteExpense, useUpdateExpense, useAddExpense, Expense, ExpenseInsert } from '@/hooks/useExpenses';
import { useProduction, useAddProduction, useUpdateProduction, useDeleteProduction, Production } from '@/hooks/useProduction';
import { PageLoader } from '@/components/shared/LoadingSpinner';

import { useNavigate } from 'react-router-dom';
import { ReceiptModal } from '@/components/sales/ReceiptModal';

const Admin = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    // ... rest of component

    const [activeTab, setActiveTab] = useState('dashboard');
    const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    const [receiptNo, setReceiptNo] = useState(0);

    // Data Fetching
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [isExpenseOpen, setIsExpenseOpen] = useState(false);
    const [selectedCustomerForPayment, setSelectedCustomerForPayment] = useState<Customer | null>(null);
    const [selectedWorkerHistory, setSelectedWorkerHistory] = useState<Labour | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

    const [editingProduction, setEditingProduction] = useState<Production | null>(null);
    const [isProductionOpen, setIsProductionOpen] = useState(false); // For adding new

    // Data Fetching
    const { data: customers, isLoading: customersLoading } = useCustomers();
    const { data: sales, isLoading: salesLoading } = useSales();
    const { data: labour, isLoading: labourLoading } = useLabour();
    const { data: expenses, isLoading: expensesLoading } = useExpenses();
    const { data: production, isLoading: productionLoading } = useProduction();
    const { data: allPayments, isLoading: paymentsLoading } = useAllCustomerPayments();

    // Mutations
    const deleteCustomer = useDeleteCustomer();
    const updateCustomer = useUpdateCustomer();
    const deleteSale = useDeleteSale();
    const updateSale = useUpdateSale();
    const deleteLabour = useDeleteLabour();
    const updateLabour = useUpdateLabour();
    const deleteExpense = useDeleteExpense();
    const updateExpense = useUpdateExpense();
    const addExpense = useAddExpense();

    const addProduction = useAddProduction();
    const updateProduction = useUpdateProduction();
    const deleteProduction = useDeleteProduction();

    // Editing State
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [editingSale, setEditingSale] = useState<Sale | null>(null);
    const [editingLabour, setEditingLabour] = useState<Labour | null>(null);

    // Form data for new production
    const [newProduction, setNewProduction] = useState<Partial<Production>>({
        date: new Date().toISOString().split('T')[0],
        quantity: 0,
        rate_per_brick: 0,
        labour_id: ''
    });

    const [newExpense, setNewExpense] = useState<Partial<ExpenseInsert>>({
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        category: 'other',
        description: ''
    });



    const isLoading = customersLoading || salesLoading || labourLoading || expensesLoading || productionLoading;

    if (isLoading) return <PageLoader />;

    // --- Stats Calculation ---
    const totalCustomers = customers?.length || 0;
    const totalSales = sales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
    const totalReceived = (sales?.reduce((sum, sale) => sum + (sale.amount_paid || 0), 0) || 0) +
        (allPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0);
    const totalLabourCost = labour?.reduce((sum, l) => sum + (l.daily_wage || 0), 0) || 0;
    const totalPending = totalSales - totalReceived;

    // --- Handlers ---
    const handleUpdateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCustomer) return;
        const errors: Record<string, boolean> = {};
        if (!editingCustomer.name) errors.name = true;
        if (!editingCustomer.mobile) errors.mobile = true;
        if (!editingCustomer.address) errors.address = true;

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.error(t('error') + ": All fields are required");
            return;
        }
        setFormErrors({});
        try {
            await updateCustomer.mutateAsync({
                id: editingCustomer.id,
                name: editingCustomer.name,
                mobile: editingCustomer.mobile || undefined,
                address: editingCustomer.address || undefined
            });
            setEditingCustomer(null);
        } catch (error) {
            console.error("Update failed", error);
        }
    };

    const handleUpdateSale = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingSale) return;

        const errors: Record<string, boolean> = {};
        if (!editingSale.date) errors.date = true;
        if (!editingSale.quantity) errors.quantity = true;
        if (!editingSale.rate_per_brick) errors.rate_per_brick = true;

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.error(t('error') + ": All fields are required");
            return;
        }
        setFormErrors({});

        const total = editingSale.quantity * editingSale.rate_per_brick;
        // Auto-update status logic
        const status = editingSale.amount_paid >= total ? 'paid' : editingSale.amount_paid > 0 ? 'partial' : 'pending';

        try {
            await updateSale.mutateAsync({
                id: editingSale.id,
                customer_id: editingSale.customer_id,
                date: editingSale.date,
                quantity: editingSale.quantity,
                rate_per_brick: editingSale.rate_per_brick,
                total_amount: total,
                amount_paid: editingSale.amount_paid,
                payment_status: editingSale.payment_status as 'paid' | 'pending' | 'partial',
                notes: editingSale.notes || undefined
            });

            // If marked as paid, prompt to share receipt
            if (status === 'paid' && editingSale.payment_status !== 'paid') {
                const fullSale = {
                    ...editingSale,
                    payment_status: status,
                    customers: customers?.find(c => c.id === editingSale.customer_id) || null
                } as unknown as Sale;
                setReceiptSale(fullSale);
                setIsReceiptOpen(true);
            }

            setEditingSale(null);
            toast.success(t('success'));
        } catch (error) {
            console.error("Update sale failed", error);
        }
    };

    const handleUpdateLabour = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingLabour) return;
        const errors: Record<string, boolean> = {};
        if (!editingLabour.name) errors.name = true;
        if (!editingLabour.work_type) errors.work_type = true;
        // daily_wage is optional now

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.error(t('error') + ": All fields are required");
            return;
        }
        setFormErrors({});
        try {
            await updateLabour.mutateAsync({
                id: editingLabour.id,
                name: editingLabour.name,
                mobile: editingLabour.mobile || undefined,
                work_type: editingLabour.work_type,
                daily_wage: editingLabour.daily_wage
            });
            setEditingLabour(null);
        } catch (error) {
            console.error("Update labour failed", error);
        }
    };

    const handleUpdateExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingExpense) return;
        const errors: Record<string, boolean> = {};
        if (!editingExpense.amount) errors.amount = true;
        if (!editingExpense.category) errors.category = true;
        if (!editingExpense.date) errors.date = true;

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.error(t('error') + ": All fields are required");
            return;
        }
        setFormErrors({});
        try {
            await updateExpense.mutateAsync({
                id: editingExpense.id,
                category: editingExpense.category,
                amount: editingExpense.amount,
                date: editingExpense.date,
                description: editingExpense.description || undefined
            });
            setEditingExpense(null);
        } catch (error) {
            console.error("Update expense failed", error);
        }
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, boolean> = {};
        if (!newExpense.amount) errors.amount = true;
        if (!newExpense.category) errors.category = true;
        if (!newExpense.date) errors.date = true;
        if (!newExpense.description) errors.description = true;

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.error(t('error') + ": All fields are required");
            return;
        }
        setFormErrors({});

        if (!newExpense.amount || !newExpense.category) return;
        try {
            await addExpense.mutateAsync({
                date: newExpense.date!,
                amount: Number(newExpense.amount),
                category: newExpense.category as any,
                description: newExpense.description || undefined
            });
            setIsExpenseOpen(false);
            setNewExpense({
                date: new Date().toISOString().split('T')[0],
                amount: 0,
                category: 'other',
                description: ''
            });
        } catch (e) { console.error(e); }
    };





    const handleAddProduction = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, boolean> = {};
        if (!newProduction.labour_id) errors.labour_id = true;
        if (!newProduction.quantity) errors.quantity = true;
        if (!newProduction.rate_per_brick) errors.rate_per_brick = true;
        if (!newProduction.date) errors.date = true;

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.error(t('error') + ": All fields are required");
            return;
        }
        setFormErrors({});

        try {
            await addProduction.mutateAsync({
                date: newProduction.date!,
                quantity: Number(newProduction.quantity),
                rate_per_brick: Number(newProduction.rate_per_brick),
                labour_id: newProduction.labour_id!,
                team_name: newProduction.team_name,
                notes: newProduction.notes
            } as any);
            setIsProductionOpen(false);
            setNewProduction({
                date: new Date().toISOString().split('T')[0],
                quantity: 0,
                rate_per_brick: 0,
                labour_id: ''
            });
        } catch (e) { console.error(e); }
    };

    const handleUpdateProduction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduction) return;

        const errors: Record<string, boolean> = {};
        if (!editingProduction.labour_id) errors.labour_id = true;
        if (!editingProduction.quantity) errors.quantity = true;
        if (!editingProduction.rate_per_brick) errors.rate_per_brick = true;
        if (!editingProduction.date) errors.date = true;

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            toast.error(t('error') + ": All fields are required");
            return;
        }
        setFormErrors({});
        try {
            await updateProduction.mutateAsync({
                id: editingProduction.id,
                date: editingProduction.date,
                quantity: Number(editingProduction.quantity),
                rate_per_brick: Number(editingProduction.rate_per_brick),
                labour_id: editingProduction.labour_id,
                team_name: editingProduction.team_name,
                notes: editingProduction.notes
            });
            setEditingProduction(null);
        } catch (e) { console.error(e); }
    };

    return (
        <div className="p-4 md:p-8 space-y-8 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('adminPanel')}</h1>
                    <p className="text-muted-foreground">{t('manageEnterprise')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">
                        <Receipt className="w-4 h-4 mr-2" />
                        {t('generateReports')}
                    </Button>
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalRevenue')}</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
                        <p className="text-xs text-muted-foreground">+20.1% {t('fromLastMonth')}</p>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalOutstanding')}</CardTitle>
                        <Receipt className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-700">{formatCurrency(totalPending)}</div>
                        <p className="text-xs text-muted-foreground">{t('pendingFromCustomers')}</p>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50 border-orange-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('activeWorkers')}</CardTitle>
                        <Hammer className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-900">{labour?.length || 0}</div>
                        <p className="text-xs text-muted-foreground">{t('estDailyCost')}: {formatCurrency(totalLabourCost)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{t('totalCustomers')}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCustomers}</div>
                        <p className="text-xs text-muted-foreground">{t('activeClients')}</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50">
                    <TabsTrigger value="dashboard" className="data-[state=active]:bg-background">{t('overview')}</TabsTrigger>
                    <TabsTrigger value="customers" className="data-[state=active]:bg-background">{t('customers')}</TabsTrigger>
                    <TabsTrigger value="sales" className="data-[state=active]:bg-background">{t('salesRegistry')}</TabsTrigger>
                    <TabsTrigger value="production" className="data-[state=active]:bg-background">{t('production')}</TabsTrigger>
                    <TabsTrigger value="labour" className="data-[state=active]:bg-background">{t('labour')}</TabsTrigger>
                    <TabsTrigger value="expenses" className="data-[state=active]:bg-background">{t('expenses')}</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('enterpriseHealth')}</CardTitle>
                            <CardDescription>{t('businessPerformance')}</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[200px] flex items-center justify-center text-muted-foreground">
                            {t('comingSoon')}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* CUSTOMERS TAB */}
                <TabsContent value="customers" className="space-y-4">
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList>
                            <TabsTrigger value="all">{t('all')}</TabsTrigger>
                            <TabsTrigger value="pending">{t('pending')}</TabsTrigger>
                            <TabsTrigger value="cleared">{t('cleared')}</TabsTrigger>
                        </TabsList>

                        {['all', 'pending', 'cleared'].map((subTab) => {
                            const filteredCustomers = customers?.filter(c => {
                                const customerSales = sales?.filter(s => s.customer_id === c.id) || [];
                                const customerPayments = allPayments?.filter(p => p.customer_id === c.id) || [];

                                const totalDebit = customerSales.reduce((sum, s) => sum + s.total_amount, 0);
                                const totalCredit = customerPayments.reduce((sum, p) => sum + p.amount, 0) +
                                    customerSales.reduce((sum, s) => sum + s.amount_paid, 0);
                                const balance = totalDebit - totalCredit;

                                if (subTab === 'pending') return balance > 10; // Tolerance of 10
                                if (subTab === 'cleared') return balance <= 10;
                                return true;
                            });

                            return (
                                <TabsContent key={subTab} value={subTab}>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>{t('customerManagement')} - {t(subTab as any)}</CardTitle>
                                            <CardDescription>{t('viewEditManage')}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead className="w-[60px]">ID</TableHead>
                                                        <TableHead>{t('customerName')}</TableHead>
                                                        <TableHead>{t('contact')}</TableHead>
                                                        <TableHead>{t('location')}</TableHead>
                                                        <TableHead className="text-right">{t('actions')}</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {filteredCustomers?.map((customer, index) => (
                                                        <TableRow key={customer.id}>
                                                            <TableCell className="font-mono text-muted-foreground">
                                                                {(index + 1).toString().padStart(3, '0')}
                                                            </TableCell>
                                                            <TableCell
                                                                className="font-medium cursor-pointer hover:underline text-primary"
                                                                onClick={() => navigate(`/customer/${customer.id}`)}
                                                            >
                                                                {customer.name}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Smartphone className="w-3 h-3 text-muted-foreground" />
                                                                    {customer.mobile || '-'}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin className="w-3 h-3 text-muted-foreground" />
                                                                    {customer.address || '-'}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right space-x-2 flex justify-end">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    onClick={() => setSelectedCustomerForPayment(customer)}
                                                                    title={t('amountPaid')}
                                                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                                                >
                                                                    <Wallet className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => navigate(`/customer/${customer.id}`)}
                                                                    title={t('viewHistory')}
                                                                >
                                                                    <Receipt className="h-4 w-4 text-blue-600" />
                                                                </Button>
                                                                <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
                                                                    <DialogTrigger asChild>
                                                                        <Button variant="ghost" size="icon" onClick={() => setEditingCustomer(customer)}>
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    {editingCustomer?.id === customer.id && (
                                                                        <DialogContent className="sm:max-w-[425px] flex flex-col p-0 gap-0 overflow-hidden max-h-[90dvh]">
                                                                            <DialogHeader className="px-6 py-4 border-b">
                                                                                <DialogTitle>{t('updateCustomer')}</DialogTitle>
                                                                            </DialogHeader>
                                                                            <div className="flex-1 overflow-y-auto px-6 py-4">
                                                                                <form id="edit-customer-form" onSubmit={handleUpdateCustomer} className="space-y-4">
                                                                                    <div className="space-y-2">
                                                                                        <Label>{t('customerName')}</Label>
                                                                                        <Input
                                                                                            value={editingCustomer.name}
                                                                                            onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                                                                                            className={formErrors.name ? "border-destructive" : ""}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="space-y-2">
                                                                                        <Label>{t('mobileNumber')}</Label>
                                                                                        <Input
                                                                                            value={editingCustomer.mobile || ''}
                                                                                            onChange={(e) => setEditingCustomer({ ...editingCustomer, mobile: e.target.value })}
                                                                                            className={formErrors.mobile ? "border-destructive" : ""}
                                                                                        />
                                                                                    </div>
                                                                                    <div className="space-y-2">
                                                                                        <Label>{t('address')}</Label>
                                                                                        <Input
                                                                                            value={editingCustomer.address || ''}
                                                                                            onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                                                                                            className={formErrors.address ? "border-destructive" : ""}
                                                                                        />
                                                                                    </div>
                                                                                </form>
                                                                            </div>
                                                                            <DialogFooter className="px-6 py-4 border-t bg-background sticky bottom-0 z-20">
                                                                                <Button type="submit" form="edit-customer-form">{t('updateCustomer')}</Button>
                                                                            </DialogFooter>
                                                                        </DialogContent>
                                                                    )}
                                                                </Dialog>

                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-destructive hover:bg-destructive/10"
                                                                    onClick={() => {
                                                                        if (confirm(t('deleteConfirm'))) deleteCustomer.mutate(customer.id)
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            );
                        })}
                    </Tabs>
                </TabsContent>

                {/* SALES TAB */}
                <TabsContent value="sales" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('salesRegistry')}</CardTitle>
                            <CardDescription>{t('trackSales')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('date')}</TableHead>
                                        <TableHead>{t('customers')}</TableHead>
                                        <TableHead>{t('details')}</TableHead>
                                        <TableHead>{t('totalAmount')} / {t('paid')}</TableHead>
                                        <TableHead>{t('status')}</TableHead>
                                        <TableHead className="text-right">{t('actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sales?.map((sale, index) => (
                                        <TableRow key={sale.id}>
                                            <TableCell>{format(new Date(sale.date), 'dd MMM yyyy')}</TableCell>
                                            <TableCell
                                                className="font-medium cursor-pointer hover:underline text-primary"
                                                onClick={() => navigate(`/customer/${sale.customer_id}`)}
                                            >
                                                {sale.customers?.name || 'Unknown'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {sale.quantity} {t('bricks')} @ ₹{sale.rate_per_brick}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{formatCurrency(sale.total_amount)}</span>
                                                    <span className="text-xs text-muted-foreground">{t('paid')}: {formatCurrency(sale.amount_paid)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${sale.payment_status === 'paid' ? 'bg-green-100 text-green-700' :
                                                    sale.payment_status === 'pending' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {t(sale.payment_status)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const fullSale = {
                                                            ...sale,
                                                            customers: customers?.find(c => c.id === sale.customer_id) || null
                                                        } as unknown as Sale;
                                                        setReceiptSale(fullSale);
                                                        setReceiptNo((sales?.length || 0) - index);
                                                        setIsReceiptOpen(true);
                                                    }}
                                                    title={t('receipt')}
                                                >
                                                    <Share2 className="h-4 w-4 text-green-600" />
                                                </Button>
                                                <Dialog open={!!editingSale} onOpenChange={(open) => !open && setEditingSale(null)}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => setEditingSale(sale)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    {editingSale?.id === sale.id && (
                                                        <DialogContent className="sm:max-w-[425px] flex flex-col p-0 gap-0 overflow-hidden max-h-[90dvh]">
                                                            <DialogHeader className="px-6 py-4 border-b">
                                                                <DialogTitle>{t('updateSale')}</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="flex-1 overflow-y-auto px-6 py-4">
                                                                <form id="edit-sale-form" onSubmit={handleUpdateSale} className="space-y-4">
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="space-y-2">
                                                                            <Label>{t('date')}</Label>
                                                                            <Input type="date" value={editingSale.date} onChange={(e) => setEditingSale({ ...editingSale, date: e.target.value })} className={formErrors.date ? "border-destructive" : ""} />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label>{t('ratePerBrick')}</Label>
                                                                            <FormattedNumberInput value={editingSale.rate_per_brick} onChange={(val) => setEditingSale({ ...editingSale, rate_per_brick: val })} className={formErrors.rate_per_brick ? "border-destructive" : ""} />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label>{t('quantity')}</Label>
                                                                            <FormattedNumberInput value={editingSale.quantity} onChange={(val) => setEditingSale({ ...editingSale, quantity: val })} className={formErrors.quantity ? "border-destructive" : ""} />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label>{t('amountPaid')}</Label>
                                                                            <FormattedNumberInput value={editingSale.amount_paid} onChange={(val) => setEditingSale({ ...editingSale, amount_paid: val })} />
                                                                        </div>
                                                                        <div className="col-span-2 space-y-2">
                                                                            <Label>{t('notes')}</Label>
                                                                            <Input
                                                                                value={editingSale.notes || ''}
                                                                                onChange={(e) => setEditingSale({ ...editingSale, notes: e.target.value })}
                                                                                placeholder={t('notes')}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </form>
                                                            </div>
                                                            <DialogFooter className="px-6 py-4 border-t bg-background sticky bottom-0 z-20">
                                                                <Button type="submit" form="edit-sale-form">{t('updateSale')}</Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    )}
                                                </Dialog>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => confirm(t('deleteConfirm')) && deleteSale.mutate(sale.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PRODUCTION TAB */}
                <TabsContent value="production" className="space-y-4">
                    <div className="flex justify-end">
                        <Dialog open={isProductionOpen} onOpenChange={setIsProductionOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    {t('addProduction')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] flex flex-col p-0 gap-0 overflow-hidden max-h-[90dvh]">
                                <DialogHeader className="px-6 py-4 border-b">
                                    <DialogTitle>{t('addProduction')}</DialogTitle>
                                </DialogHeader>
                                <div className="flex-1 overflow-y-auto px-6 py-4">
                                    <form id="add-production-form" onSubmit={handleAddProduction} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>{t('date')}</Label>
                                                <Input type="date" value={newProduction.date} onChange={e => setNewProduction({ ...newProduction, date: e.target.value })} className={formErrors.date ? "border-destructive" : ""} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('worker')}/{t('team')}</Label>
                                                <Select value={newProduction.labour_id} onValueChange={val => setNewProduction({ ...newProduction, labour_id: val })}>
                                                    <SelectTrigger><SelectValue placeholder={t('selectLabour')} /></SelectTrigger>
                                                    <SelectContent>
                                                        {labour?.map(l => (
                                                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('quantity')}</Label>
                                                <FormattedNumberInput value={newProduction.quantity} onChange={val => setNewProduction({ ...newProduction, quantity: val })} className={formErrors.quantity ? "border-destructive" : ""} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{t('ratePerBrick')}</Label>
                                                <FormattedNumberInput value={newProduction.rate_per_brick} onChange={val => setNewProduction({ ...newProduction, rate_per_brick: val })} className={formErrors.rate_per_brick ? "border-destructive" : ""} />
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <Label>{t('notes')}</Label>
                                                <Input
                                                    value={newProduction.notes || ''}
                                                    onChange={e => setNewProduction({ ...newProduction, notes: e.target.value })}
                                                    placeholder={t('notes')}
                                                />
                                            </div>
                                        </div>
                                        <div className="bg-muted p-2 rounded text-sm text-right font-bold">
                                            Total: {formatCurrency(Number(newProduction.quantity || 0) * Number(newProduction.rate_per_brick || 0))}
                                        </div>
                                    </form>
                                </div>
                                <DialogFooter className="px-6 py-4 border-t bg-background sticky bottom-0 z-20">
                                    <Button type="submit" form="add-production-form">{t('saveRecord')}</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('brickProduction')}</CardTitle>
                            <CardDescription>{t('trackDaily')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('date')}</TableHead>
                                        <TableHead>{t('worker')}</TableHead>
                                        <TableHead className="text-right">{t('quantity')}</TableHead>
                                        <TableHead className="text-right">{t('ratePerBrick')}</TableHead>
                                        <TableHead className="text-right">{t('totalAmount')}</TableHead>
                                        <TableHead className="text-right">{t('actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {production?.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell>{format(new Date(p.date), 'dd MMM')}</TableCell>
                                            <TableCell>{p.labour?.name || 'Unknown'}</TableCell>
                                            <TableCell className="text-right">{p.quantity}</TableCell>
                                            <TableCell className="text-right">{p.rate_per_brick}</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(p.quantity * p.rate_per_brick)}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Dialog open={!!editingProduction} onOpenChange={(open) => !open && setEditingProduction(null)}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => setEditingProduction(p)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    {editingProduction?.id === p.id && (
                                                        <DialogContent className="sm:max-w-[425px] flex flex-col p-0 gap-0 overflow-hidden max-h-[90dvh]">
                                                            <DialogHeader className="px-6 py-4 border-b"><DialogTitle>{t('edit')}</DialogTitle></DialogHeader>
                                                            <div className="flex-1 overflow-y-auto px-6 py-4">
                                                                <form id="edit-production-form" onSubmit={handleUpdateProduction} className="space-y-4">
                                                                    <div className="grid grid-cols-2 gap-4">
                                                                        <div className="space-y-2">
                                                                            <Label>{t('date')}</Label>
                                                                            <Input type="date" value={editingProduction.date} onChange={e => setEditingProduction({ ...editingProduction, date: e.target.value })} className={formErrors.date ? "border-destructive" : ""} />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label>{t('quantity')}</Label>
                                                                            <FormattedNumberInput value={editingProduction.quantity} onChange={val => setEditingProduction({ ...editingProduction, quantity: val })} className={formErrors.quantity ? "border-destructive" : ""} />
                                                                        </div>
                                                                        <div className="space-y-2">
                                                                            <Label>{t('ratePerBrick')}</Label>
                                                                            <FormattedNumberInput value={editingProduction.rate_per_brick} onChange={val => setEditingProduction({ ...editingProduction, rate_per_brick: val })} className={formErrors.rate_per_brick ? "border-destructive" : ""} />
                                                                        </div>
                                                                        <div className="col-span-2 space-y-2">
                                                                            <Label>{t('notes')}</Label>
                                                                            <Input
                                                                                value={editingProduction.notes || ''}
                                                                                onChange={e => setEditingProduction({ ...editingProduction, notes: e.target.value })}
                                                                                placeholder={t('notes')}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </form>
                                                            </div>
                                                            <DialogFooter className="px-6 py-4 border-t bg-background sticky bottom-0 z-20"><Button type="submit" form="edit-production-form">{t('save')}</Button></DialogFooter>
                                                        </DialogContent>
                                                    )}
                                                </Dialog>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => confirm(t('deleteConfirm')) && deleteProduction.mutate(p.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* LABOUR TAB */}
                <TabsContent value="labour" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('labourRegistry')}</CardTitle>
                            <CardDescription>{t('manageDailyWage')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('worker')}</TableHead>
                                        <TableHead>{t('role')}</TableHead>
                                        <TableHead>{t('dailyWage')}</TableHead>
                                        <TableHead className="text-right">{t('actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {labour?.map((l) => (
                                        <TableRow key={l.id}>
                                            <TableCell className="font-medium">{l.name}</TableCell>
                                            <TableCell className="capitalize">{t(l.work_type)}</TableCell>
                                            <TableCell>{formatCurrency(l.daily_wage)}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => setSelectedWorkerHistory(l)}>
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                                <Dialog open={!!editingLabour} onOpenChange={(open) => !open && setEditingLabour(null)}>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={() => setEditingLabour(l)}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    {editingLabour?.id === l.id && (
                                                        <DialogContent className="sm:max-w-[425px] flex flex-col p-0 gap-0 overflow-hidden max-h-[90dvh]">
                                                            <DialogHeader className="px-6 py-4 border-b">
                                                                <DialogTitle>{t('edit')}</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="flex-1 overflow-y-auto px-6 py-4">
                                                                <form id="edit-labour-form" onSubmit={handleUpdateLabour} className="space-y-4">
                                                                    <div className="space-y-2">
                                                                        <Label>{t('labourName')}</Label>
                                                                        <Input value={editingLabour.name} onChange={(e) => setEditingLabour({ ...editingLabour, name: e.target.value })} />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label>{t('role')}</Label>
                                                                        <Select value={editingLabour.work_type} onValueChange={(val: any) => setEditingLabour({ ...editingLabour, work_type: val })}>
                                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="moulding">{t('moulding')}</SelectItem>
                                                                                <SelectItem value="stacking">{t('stacking')}</SelectItem>
                                                                                <SelectItem value="loading">{t('loading')}</SelectItem>
                                                                                <SelectItem value="general">{t('general')}</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label>{t('dailyWage')}</Label>
                                                                        <Input type="number" value={editingLabour.daily_wage} onChange={(e) => setEditingLabour({ ...editingLabour, daily_wage: Number(e.target.value) })} />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label>{t('pin')}</Label>
                                                                        <Input
                                                                            type="text"
                                                                            value={editingLabour.pin || ''}
                                                                            onChange={(e) => setEditingLabour({ ...editingLabour, pin: e.target.value })}
                                                                            placeholder={t('setPin')}
                                                                        />
                                                                    </div>
                                                                </form>
                                                            </div>
                                                            <DialogFooter className="px-6 py-4 border-t bg-background sticky bottom-0 z-20">
                                                                <Button type="submit" form="edit-labour-form">{t('updateWorker')}</Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    )}
                                                </Dialog>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => confirm(t('deleteConfirm')) && deleteLabour.mutate(l.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* EXPENSES TAB */}
                <TabsContent value="expenses" className="space-y-4">
                    <div className="flex justify-end">
                        <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    {t('addExpense')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] flex flex-col p-0 gap-0 overflow-hidden max-h-[90dvh]">
                                <DialogHeader className="px-6 py-4 border-b"><DialogTitle>{t('addExpense')}</DialogTitle></DialogHeader>
                                <div className="flex-1 overflow-y-auto px-6 py-4">
                                    <form id="add-expense-form" onSubmit={handleAddExpense} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>{t('date')}</Label>
                                            <Input type="date" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} className={formErrors.date ? "border-destructive" : ""} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('category')}</Label>
                                            <Select value={newExpense.category} onValueChange={(val: any) => setNewExpense({ ...newExpense, category: val })}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="raw_material">{t('rawMaterial')}</SelectItem>
                                                    <SelectItem value="transport">{t('transport')}</SelectItem>
                                                    <SelectItem value="labour">{t('labour')}</SelectItem>
                                                    <SelectItem value="maintenance">{t('maintenance')}</SelectItem>
                                                    <SelectItem value="other">{t('other')}</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('amount')}</Label>
                                            <FormattedNumberInput
                                                value={newExpense.amount || ''}
                                                onChange={(val) => setNewExpense({ ...newExpense, amount: val })}
                                                className={formErrors.amount ? "border-destructive" : ""}
                                                placeholder={t('amount')}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>{t('description')}</Label>
                                            <Input value={newExpense.description || ''} onChange={e => setNewExpense({ ...newExpense, description: e.target.value })} className={formErrors.description ? "border-destructive" : ""} />
                                        </div>
                                    </form>
                                </div>
                                <DialogFooter className="px-6 py-4 border-t bg-background sticky bottom-0 z-20"><Button type="submit" form="add-expense-form">{t('save')}</Button></DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('expenses')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t('date')}</TableHead>
                                        <TableHead>{t('category')}</TableHead>
                                        <TableHead>{t('description')}</TableHead>
                                        <TableHead className="text-right">{t('amount')}</TableHead>
                                        <TableHead className="text-right">{t('actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses?.map((ex) => (
                                        <TableRow key={ex.id}>
                                            <TableCell>{format(new Date(ex.date), 'dd MMM')}</TableCell>
                                            <TableCell className="capitalize">{t(ex.category === 'raw_material' ? 'rawMaterial' : ex.category as any)}</TableCell>
                                            <TableCell>{ex.description}</TableCell>
                                            <TableCell className="text-right font-bold">{formatCurrency(ex.amount)}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => setEditingExpense(ex)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => confirm(t('deleteConfirm')) && deleteExpense.mutate(ex.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <ReceiptModal
                isOpen={isReceiptOpen}
                onClose={() => setIsReceiptOpen(false)}
                sale={receiptSale}
                customerName={receiptSale?.customers?.name}
                customerMobile={receiptSale?.customers?.mobile || undefined}
                receiptNo={receiptNo}
                allSales={sales || undefined}
            />

            <AddPaymentSheet
                isOpen={!!selectedCustomerForPayment}
                onClose={() => setSelectedCustomerForPayment(null)}
                customerId={selectedCustomerForPayment?.id || ''}
                customerName={selectedCustomerForPayment?.name}
            />
            <WorkerHistorySheet
                isOpen={!!selectedWorkerHistory}
                onClose={() => setSelectedWorkerHistory(null)}
                worker={selectedWorkerHistory}
                production={production}
            />

            {editingExpense && (
                <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
                    <DialogContent className="sm:max-w-[425px] flex flex-col p-0 gap-0 overflow-hidden max-h-[90dvh]">
                        <DialogHeader className="px-6 py-4 border-b"><DialogTitle>{t('edit')}</DialogTitle></DialogHeader>
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            <form id="edit-expense-form" onSubmit={handleUpdateExpense} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>{t('category')}</Label>
                                    <Select value={editingExpense.category} onValueChange={(val: any) => setEditingExpense({ ...editingExpense, category: val })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="raw_material">{t('rawMaterial')}</SelectItem>
                                            <SelectItem value="transport">{t('transport')}</SelectItem>
                                            <SelectItem value="labour">{t('labour')}</SelectItem>
                                            <SelectItem value="maintenance">{t('maintenance')}</SelectItem>
                                            <SelectItem value="other">{t('other')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('date')}</Label>
                                    <Input type="date" value={editingExpense.date} onChange={e => setEditingExpense({ ...editingExpense, date: e.target.value })} className={formErrors.date ? "border-destructive" : ""} />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('amount')}</Label>
                                    <FormattedNumberInput
                                        value={editingExpense.amount}
                                        onChange={(val) => setEditingExpense({ ...editingExpense, amount: val })}
                                        className={formErrors.amount ? "border-destructive" : ""}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{t('description')}</Label>
                                    <Input value={editingExpense.description || ''} onChange={e => setEditingExpense({ ...editingExpense, description: e.target.value })} className={formErrors.description ? "border-destructive" : ""} />
                                </div>
                            </form>
                        </div>
                        <DialogFooter className="px-6 py-4 border-t bg-background sticky bottom-0 z-20"><Button type="submit" form="edit-expense-form">{t('save')}</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

export default Admin;

