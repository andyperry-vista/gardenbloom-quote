import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mayura Garden Services"

interface TaxInvoiceProps {
  clientName?: string
  invoiceNumber?: string
  amount?: string
  dueDate?: string
  notes?: string
}

const TaxInvoiceEmail = ({ clientName, invoiceNumber, amount, dueDate, notes }: TaxInvoiceProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Tax Invoice {invoiceNumber || ''} from {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Tax Invoice</Heading>
        <Text style={text}>
          {clientName ? `Hi ${clientName},` : 'Hi,'} please find your tax invoice from {SITE_NAME} below.
        </Text>
        <Hr style={hr} />
        <Section>
          {invoiceNumber && (
            <>
              <Text style={label}>Invoice Number</Text>
              <Text style={value}>{invoiceNumber}</Text>
            </>
          )}
          {amount && (
            <>
              <Text style={label}>Amount Due (incl. GST)</Text>
              <Text style={value}>{amount}</Text>
            </>
          )}
          {dueDate && (
            <>
              <Text style={label}>Due Date</Text>
              <Text style={value}>{dueDate}</Text>
            </>
          )}
          {notes && (
            <>
              <Text style={label}>Notes</Text>
              <Text style={value}>{notes}</Text>
            </>
          )}
        </Section>
        <Hr style={hr} />
        <Text style={text}>
          Payment is due within 14 days. Please transfer to the bank details provided on the attached invoice, or reply to this email for alternative payment options.
        </Text>
        <Text style={footer}>ABN: 22 046 912 532 | {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: TaxInvoiceEmail,
  subject: (data: Record<string, any>) => `Tax Invoice ${data.invoiceNumber || ''} — ${SITE_NAME}`,
  displayName: 'Tax invoice',
  previewData: { clientName: 'Lisa', invoiceNumber: 'INV-042', amount: '$1,320.00', dueDate: '29 April 2026' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e3a2b', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const hr = { borderColor: '#e0e0e0', margin: '20px 0' }
const label = { fontSize: '12px', color: '#888888', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 2px', fontWeight: '600' as const }
const value = { fontSize: '15px', color: '#1e3a2b', margin: '0 0 14px' }
const footer = { fontSize: '12px', color: '#999999', margin: '20px 0 0' }
