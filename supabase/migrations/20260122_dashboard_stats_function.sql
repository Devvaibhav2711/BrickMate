-- Create a database function to fetch all dashboard stats in a single call
-- This dramatically reduces latency by avoiding multiple round trips

CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  v_total_bricks BIGINT;
  v_total_sales NUMERIC;
  v_total_expenses NUMERIC;
  v_total_direct_paid NUMERIC;
  v_total_ledger_paid NUMERIC;
  v_active_workers INT;
  v_monthly_production BIGINT;
  v_monthly_sales NUMERIC;
  v_monthly_expenses NUMERIC;
  v_current_month_start DATE;
  v_current_month_end DATE;
BEGIN
  -- Calculate current month boundaries
  v_current_month_start := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  v_current_month_end := (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

  -- Total Bricks (filtered by date range if provided)
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    SELECT COALESCE(SUM(quantity), 0) INTO v_total_bricks
    FROM brick_production
    WHERE date >= p_start_date AND date < p_end_date;
  ELSE
    SELECT COALESCE(SUM(quantity), 0) INTO v_total_bricks FROM brick_production;
  END IF;

  -- Total Sales
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    SELECT 
      COALESCE(SUM(total_amount), 0),
      COALESCE(SUM(amount_paid), 0)
    INTO v_total_sales, v_total_direct_paid
    FROM sales
    WHERE date >= p_start_date AND date < p_end_date;
  ELSE
    SELECT 
      COALESCE(SUM(total_amount), 0),
      COALESCE(SUM(amount_paid), 0)
    INTO v_total_sales, v_total_direct_paid
    FROM sales;
  END IF;

  -- Total Expenses
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
    FROM expenses
    WHERE date >= p_start_date AND date < p_end_date;
  ELSE
    SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses FROM expenses;
  END IF;

  -- Customer Payments (ledger)
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    SELECT COALESCE(SUM(amount), 0) INTO v_total_ledger_paid
    FROM customer_payments
    WHERE payment_date >= p_start_date AND payment_date < p_end_date;
  ELSE
    SELECT COALESCE(SUM(amount), 0) INTO v_total_ledger_paid FROM customer_payments;
  END IF;

  -- Active Workers (count of workers with activity in period)
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    SELECT COUNT(DISTINCT worker_id) INTO v_active_workers
    FROM (
      SELECT labour_id AS worker_id FROM brick_production 
      WHERE date >= p_start_date AND date < p_end_date AND labour_id IS NOT NULL
      UNION
      SELECT labour_id AS worker_id FROM attendance 
      WHERE date >= p_start_date AND date < p_end_date AND labour_id IS NOT NULL
    ) active;
  ELSE
    SELECT COUNT(*) INTO v_active_workers FROM labour;
  END IF;

  -- Monthly Production (current month)
  SELECT COALESCE(SUM(quantity), 0) INTO v_monthly_production
  FROM brick_production
  WHERE date >= v_current_month_start AND date <= v_current_month_end;

  -- Monthly Sales (current month)
  SELECT COALESCE(SUM(total_amount), 0) INTO v_monthly_sales
  FROM sales
  WHERE date >= v_current_month_start AND date <= v_current_month_end;

  -- Monthly Expenses (current month)
  SELECT COALESCE(SUM(amount), 0) INTO v_monthly_expenses
  FROM expenses
  WHERE date >= v_current_month_start AND date <= v_current_month_end;

  -- Build result JSON
  result := json_build_object(
    'totalBricks', v_total_bricks,
    'totalSales', v_total_sales,
    'totalExpenses', v_total_expenses,
    'netProfit', v_total_sales - v_total_expenses,
    'pendingPayments', v_total_sales - (v_total_direct_paid + v_total_ledger_paid),
    'activeWorkers', v_active_workers,
    'monthlyProduction', v_monthly_production,
    'monthlySales', v_monthly_sales,
    'monthlyExpenses', v_monthly_expenses
  );

  RETURN result;
END;
$$;
