/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as quoteRequest } from './quote-request.tsx'
import { template as paymentRemittance } from './payment-remittance.tsx'
import { template as unpaidInvoice } from './unpaid-invoice.tsx'
import { template as quoteFollowup } from './quote-followup.tsx'
import { template as jobCompletion } from './job-completion.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'quote-request': quoteRequest,
  'payment-remittance': paymentRemittance,
  'unpaid-invoice': unpaidInvoice,
  'quote-followup': quoteFollowup,
  'job-completion': jobCompletion,
}
