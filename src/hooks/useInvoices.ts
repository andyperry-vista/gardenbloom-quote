import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Invoice {
  id: string;
  jobId: string | null;
  clientId: string | null;
  invoiceNumber: string;
  amount: number;
  gstAmount: number;
  totalWithGst: number;
  status: "unpaid" | "sent" | "paid" | "overdue";
  dueDate: string | null;
  paidDate: string | null;
  sentAt: string | null;
  notes: string;
  createdAt: string;
  client?: { name: string; address: string; email: string; phone: string };
  job?: { job_number: string };
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  notes: string;
  createdAt: string;
}

export function useInvoices() {
  const qc = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, clients(name, address, email, phone), jobs(job_number)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((r: any): Invoice => ({
        id: r.id,
        jobId: r.job_id,
        clientId: r.client_id,
        invoiceNumber: r.invoice_number,
        amount: Number(r.amount),
        gstAmount: Number(r.gst_amount),
        totalWithGst: Number(r.total_with_gst),
        status: r.status,
        dueDate: r.due_date,
        paidDate: r.paid_date,
        sentAt: r.sent_at,
        notes: r.notes ?? "",
        createdAt: r.created_at,
        client: r.clients ?? undefined,
        job: r.jobs ?? undefined,
      }));
    },
  });

  const createInvoiceMut = useMutation({
    mutationFn: async (params: { jobId: string; clientId: string; amount: number; dueDate?: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const gst = params.amount * 0.1;
      const { data, error } = await supabase
        .from("invoices")
        .insert({
          user_id: user.id,
          job_id: params.jobId,
          client_id: params.clientId,
          amount: params.amount,
          gst_amount: gst,
          total_with_gst: params.amount + gst,
          due_date: params.dueDate ?? null,
          notes: params.notes ?? "",
        })
        .select("id, invoice_number")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const updateInvoiceMut = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<{ status: Invoice["status"]; dueDate: string | null; paidDate: string | null; sentAt: string | null; notes: string }> }) => {
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.paidDate !== undefined) dbUpdates.paid_date = updates.paidDate;
      if (updates.sentAt !== undefined) dbUpdates.sent_at = updates.sentAt;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from("invoices").update(dbUpdates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });

  return {
    invoices,
    isLoading,
    createInvoice: createInvoiceMut.mutateAsync,
    updateInvoice: (id: string, updates: Partial<{ status: Invoice["status"]; dueDate: string | null; paidDate: string | null; sentAt: string | null; notes: string }>) => updateInvoiceMut.mutate({ id, updates }),
  };
}

export function usePayments(invoiceId?: string) {
  const qc = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", invoiceId],
    queryFn: async () => {
      if (!invoiceId) return [];
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("payment_date", { ascending: false });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((r: any): Payment => ({
        id: r.id,
        invoiceId: r.invoice_id,
        amount: Number(r.amount),
        paymentMethod: r.payment_method ?? "",
        paymentDate: r.payment_date,
        notes: r.notes ?? "",
        createdAt: r.created_at,
      }));
    },
    enabled: !!invoiceId,
  });

  const addPaymentMut = useMutation({
    mutationFn: async (params: { invoiceId: string; amount: number; paymentMethod: string; paymentDate: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("payments").insert({
        user_id: user.id,
        invoice_id: params.invoiceId,
        amount: params.amount,
        payment_method: params.paymentMethod,
        payment_date: params.paymentDate,
        notes: params.notes ?? "",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  return {
    payments,
    isLoading,
    addPayment: addPaymentMut.mutateAsync,
  };
}
