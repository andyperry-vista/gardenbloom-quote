import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Quote, QuoteLineItem, Client } from "@/types/quote";

interface DbQuote {
  id: string;
  user_id: string;
  client_id: string | null;
  status: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any;
  subtotal: number;
  markup_total: number;
  grand_total: number;
  discount_type: string;
  discount_value: number;
  notes: string;
  created_at: string;
  updated_at: string;
  clients: { id: string; name: string; email: string; phone: string; address: string } | null;
}

function mapDbToQuote(row: DbQuote): Quote {
  const client = row.clients ?? { id: row.client_id ?? "", name: "", email: "", phone: "", address: "" };
  return {
    id: row.id,
    client: { id: client.id, name: client.name, email: client.email ?? "", phone: client.phone ?? "", address: client.address ?? "" },
    items: (row.items as QuoteLineItem[]) ?? [],
    subtotal: Number(row.subtotal),
    markupTotal: Number(row.markup_total),
    grandTotal: Number(row.grand_total),
    discountType: (row.discount_type as Quote["discountType"]) ?? "none",
    discountValue: Number(row.discount_value ?? 0),
    status: row.status as Quote["status"],
    createdAt: row.created_at,
    notes: row.notes || undefined,
  };
}

export function useQuotes() {
  const qc = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, clients(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as unknown as DbQuote[]).map(mapDbToQuote);
    },
  });

  const addQuoteMut = useMutation({
    mutationFn: async (quote: { client: Client; items: QuoteLineItem[]; subtotal: number; markupTotal: number; grandTotal: number; discountType?: string; discountValue?: number; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upsert client
      let clientId: string;
      const { data: existingClients } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .eq("name", quote.client.name)
        .eq("address", quote.client.address)
        .limit(1);

      if (existingClients && existingClients.length > 0) {
        clientId = existingClients[0].id;
        await supabase.from("clients").update({
          email: quote.client.email,
          phone: quote.client.phone,
          updated_at: new Date().toISOString(),
        }).eq("id", clientId);
      } else {
        const { data: newClient, error: clientErr } = await supabase
          .from("clients")
          .insert({ user_id: user.id, name: quote.client.name, email: quote.client.email, phone: quote.client.phone, address: quote.client.address })
          .select("id")
          .single();
        if (clientErr) throw clientErr;
        clientId = newClient.id;
      }

      const { data, error } = await supabase
        .from("quotes")
        .insert({
          user_id: user.id,
          client_id: clientId,
          status: "draft",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          items: quote.items as any,
          subtotal: quote.subtotal,
          markup_total: quote.markupTotal,
          grand_total: quote.grandTotal,
          discount_type: quote.discountType ?? "none",
          discount_value: quote.discountValue ?? 0,
          notes: quote.notes ?? "",
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes"] }),
  });

  const updateQuoteMut = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Quote> }) => {
      const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.items) dbUpdates.items = updates.items;
      if (updates.subtotal !== undefined) dbUpdates.subtotal = updates.subtotal;
      if (updates.markupTotal !== undefined) dbUpdates.markup_total = updates.markupTotal;
      if (updates.grandTotal !== undefined) dbUpdates.grand_total = updates.grandTotal;
      if (updates.discountType !== undefined) dbUpdates.discount_type = updates.discountType;
      if (updates.discountValue !== undefined) dbUpdates.discount_value = updates.discountValue;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      // Update client if provided
      if (updates.client) {
        const { data: quote } = await supabase.from("quotes").select("client_id").eq("id", id).single();
        if (quote?.client_id) {
          await supabase.from("clients").update({
            name: updates.client.name,
            email: updates.client.email,
            phone: updates.client.phone,
            address: updates.client.address,
            updated_at: new Date().toISOString(),
          }).eq("id", quote.client_id);
        }
      }

      const { error } = await supabase.from("quotes").update(dbUpdates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes"] }),
  });

  const deleteQuoteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes"] }),
  });

  const addQuote = async (quote: { client: Client; items: QuoteLineItem[]; subtotal: number; markupTotal: number; grandTotal: number; discountType?: string; discountValue?: number; notes?: string }) => {
    return addQuoteMut.mutateAsync(quote);
  };

  const updateQuote = (id: string, updates: Partial<Quote>) => {
    updateQuoteMut.mutate({ id, updates });
  };

  const deleteQuote = (id: string) => {
    deleteQuoteMut.mutate(id);
  };

  return { quotes, isLoading, addQuote, updateQuote, deleteQuote };
}
