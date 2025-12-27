import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle, Phone, MapPin, Plus, ShoppingCart, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCustomers, useAddCustomer, CustomerInsert, Customer } from '@/hooks/useCustomers';
import { useSales, useAddSale, SaleInsert, Sale } from '@/hooks/useSales';
import { ReceiptModal } from '@/components/sales/ReceiptModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageLoader } from '@/components/shared/LoadingSpinner';
import { FloatingActionButton } from '@/components/shared/FloatingActionButton';
import { cn, formatCurrency } from '@/lib/utils';
import { FormattedNumberInput } from '@/components/shared/FormattedNumberInput';

const paymentStatusColors = {
  paid: 'bg-success/10 text-success',
  pending: 'bg-destructive/10 text-destructive',
  partial: 'bg-warning/10 text-warning',
};

export const Customers = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: sales, isLoading: salesLoading } = useSales();
  const addCustomer = useAddCustomer();
  const addSale = useAddSale();

  const [activeTab, setActiveTab] = useState('customers');
  const [isCustomerSheetOpen, setIsCustomerSheetOpen] = useState(false);
  const [isSaleSheetOpen, setIsSaleSheetOpen] = useState(false);
  /* Removed duplicate saleForm, setSaleForm from line 57 */
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptNo, setReceiptNo] = useState(0);
  const [isReceiptLedger, setIsReceiptLedger] = useState(false);

  const [customerForm, setCustomerForm] = useState<CustomerInsert>({
    name: '',
    mobile: '',
    address: '',
  });
  const [customerErrors, setCustomerErrors] = useState<Record<string, boolean>>({});

  const [saleForm, setSaleForm] = useState<SaleInsert>({
    customer_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    quantity: 0,
    rate_per_brick: 0,
    total_amount: 0,
    amount_paid: 0,
    payment_status: 'pending',
  });
  const [saleErrors, setSaleErrors] = useState<Record<string, boolean>>({});

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!customerForm.name.trim()) newErrors.name = true;
    if (!customerForm.mobile) newErrors.mobile = true;
    if (!customerForm.address) newErrors.address = true;

    if (customers?.some(c => c.mobile === customerForm.mobile)) {
      toast.error(t('error') + ": Mobile number already exists!");
      newErrors.mobile = true;
      setCustomerErrors(newErrors);
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setCustomerErrors(newErrors);
      toast.error(t('error') + ": All fields are required");
      return;
    }
    setCustomerErrors({});

    await addCustomer.mutateAsync(customerForm);
    setCustomerForm({ name: '', mobile: '', address: '' });
    setIsCustomerSheetOpen(false);
  };

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!saleForm.customer_id) newErrors.customer_id = true;
    if (saleForm.quantity <= 0) newErrors.quantity = true;
    if (!saleForm.date) newErrors.date = true;
    if (!saleForm.rate_per_brick) newErrors.rate_per_brick = true;

    if (Object.keys(newErrors).length > 0) {
      setSaleErrors(newErrors);
      toast.error(t('error') + ": All fields are required");
      return;
    }
    setSaleErrors({});

    const total = saleForm.quantity * saleForm.rate_per_brick;
    const status: 'paid' | 'pending' | 'partial' =
      saleForm.amount_paid >= total ? 'paid' :
        saleForm.amount_paid > 0 ? 'partial' : 'pending';

    const newSale = await addSale.mutateAsync({
      ...saleForm,
      total_amount: total,
      payment_status: status,
    });

    const selectedCustomer = customers?.find(c => c.id === saleForm.customer_id);

    const saleForReceipt: Sale = {
      ...newSale,
      customers: selectedCustomer ? { name: selectedCustomer.name, mobile: selectedCustomer.mobile } : null
    } as unknown as Sale;

    // Calculate Receipt No (Simple count based)
    const currentTotalSales = sales?.length || 0;
    const receiptNo = currentTotalSales + 1;

    setReceiptSale(saleForReceipt);
    setReceiptNo(receiptNo); // New state
    setIsReceiptLedger(false);
    setIsReceiptOpen(true);

    setSaleForm({
      customer_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      quantity: 0,
      rate_per_brick: 0,
      total_amount: 0,
      amount_paid: 0,
      payment_status: 'pending',
    });
    setIsSaleSheetOpen(false);
  };



  const isLoading = customersLoading || salesLoading;

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="p-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="customers">{t('customers')}</TabsTrigger>
          <TabsTrigger value="sales">{t('addSale')}</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="mt-0">
          {!customers?.length ? (
            <EmptyState
              icon={<UserCircle className="w-8 h-8 text-muted-foreground" />}
              title={t('noData')}
              description={t('addFirstCustomer')}
              actionLabel={t('addCustomer')}
              onAction={() => setIsCustomerSheetOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {customers.map((customer, index) => (
                  <motion.div
                    key={customer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-xl p-4 border border-border shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => navigate(`/customer/${customer.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            #{(index + 1).toString().padStart(3, '0')}
                          </span>
                        </div>
                        <h3 className="font-semibold text-foreground text-lg truncate">
                          {customer.name}
                        </h3>
                        {customer.mobile && (
                          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <Phone className="w-3.5 h-3.5" />
                            {customer.mobile}
                          </div>
                        )}
                        {customer.address && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{customer.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="sales" className="mt-0">
          {!sales?.length ? (
            <EmptyState
              icon={<ShoppingCart className="w-8 h-8 text-muted-foreground" />}
              title={t('noData')}
              description={t('recordFirstSale')}
              actionLabel={t('addSale')}
              onAction={() => setIsSaleSheetOpen(true)}
            />
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {sales.map((sale, index) => (
                  <motion.div
                    key={sale.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-xl p-4 border border-border shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => navigate(`/customer/${sale.customer_id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">
                          {sale.customers?.name || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(sale.date), 'dd MMM yyyy')} • {sale.quantity.toLocaleString('en-IN')} {t('bricks')}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <span className="flex items-center gap-1 text-lg font-bold text-foreground">
                            {formatCurrency(sale.total_amount)}
                          </span>
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-medium',
                              paymentStatusColors[sale.payment_status]
                            )}
                          >
                            {t(sale.payment_status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <FloatingActionButton
        onClick={() => activeTab === 'customers' ? setIsCustomerSheetOpen(true) : setIsSaleSheetOpen(true)}
        label={activeTab === 'customers' ? t('addCustomer') : t('addSale')}
      />

      {/* Add Customer Sheet */}
      <Sheet open={isCustomerSheetOpen} onOpenChange={setIsCustomerSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90dvh] flex flex-col p-0 gap-0 overflow-hidden">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="text-left">{t('addCustomer')}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form id="customer-form" onSubmit={handleAddCustomer} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">{t('customerName')} *</Label>
                <Input
                  id="customerName"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  placeholder={t('enterName')}
                  required
                  className={customerErrors.name ? "border-destructive" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerMobile">{t('mobileNumber')}</Label>
                <Input
                  id="customerMobile"
                  type="tel"
                  value={customerForm.mobile}
                  onChange={(e) => setCustomerForm({ ...customerForm, mobile: e.target.value })}
                  placeholder="9876543210"
                  className={customerErrors.mobile ? "border-destructive" : ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customerAddress">{t('address')}</Label>
                <Textarea
                  id="customerAddress"
                  value={customerForm.address}
                  onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })}
                  placeholder={t('address')}
                  rows={2}
                  className={customerErrors.address ? "border-destructive" : ""}
                />
              </div>
            </form>
          </div>
          <div className="px-6 py-4 border-t bg-background sticky bottom-0 z-20 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCustomerSheetOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" form="customer-form" className="flex-1" disabled={addCustomer.isPending}>
              <Plus className="w-4 h-4" />
              {t('save')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Sale Sheet */}
      <Sheet open={isSaleSheetOpen} onOpenChange={setIsSaleSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[90dvh] flex flex-col p-0 gap-0 overflow-hidden">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="text-left">{t('addSale')}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <form id="sale-form" onSubmit={handleAddSale} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('customerName')} *</Label>
                <Select
                  value={saleForm.customer_id}
                  onValueChange={(value) => setSaleForm({ ...saleForm, customer_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('customerName')} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="saleDate">{t('date')} *</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={saleForm.date}
                  onChange={(e) => setSaleForm({ ...saleForm, date: e.target.value })}
                  required
                  className={saleErrors.date ? "border-destructive" : ""}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="saleQty">{t('quantity')} *</Label>
                  <FormattedNumberInput
                    id="saleQty"
                    value={saleForm.quantity || ''}
                    onChange={(val) => setSaleForm({ ...saleForm, quantity: val })}
                    placeholder="1000"
                    required
                    className={saleErrors.quantity ? "border-destructive" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">{t('ratePerBrick')} *</Label>
                  <FormattedNumberInput
                    id="rate"
                    value={saleForm.rate_per_brick || ''}
                    onChange={(val) => setSaleForm({ ...saleForm, rate_per_brick: val })}
                    placeholder="8.50"
                    required
                    className={saleErrors.rate_per_brick ? "border-destructive" : ""}
                  />
                </div>
              </div>

              <div className="bg-accent/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">{t('totalAmount')}</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(saleForm.quantity * saleForm.rate_per_brick)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountPaid">{t('amountPaid')}</Label>
                <FormattedNumberInput
                  id="amountPaid"
                  value={saleForm.amount_paid || ''}
                  onChange={(val) => setSaleForm({ ...saleForm, amount_paid: val })}
                  placeholder="0"
                />
              </div>
            </form>
          </div>
          <div className="px-6 py-4 border-t bg-background sticky bottom-0 z-20 flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsSaleSheetOpen(false)}>
              {t('cancel')}
            </Button>
            <Button type="submit" form="sale-form" className="flex-1" disabled={addSale.isPending}>
              <Plus className="w-4 h-4" />
              {t('save')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={receiptSale}
        customerName={receiptSale?.customers?.name}
        customerMobile={receiptSale?.customers?.mobile || undefined}
        receiptNo={receiptNo}
        allSales={sales || []}
        showLedger={isReceiptLedger}
      />
    </div >
  );
};

export default Customers;
