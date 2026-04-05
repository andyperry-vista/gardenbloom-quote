import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mayura Garden Services"

interface UnpaidInvoiceProps {
  clientName?: string
  invoiceNumber?: string
  amount?: string
  dueDate?: string
  daysPastDue?: string
  notes?: string
}

const UnpaidInvoiceEmail = ({ clientName, invoiceNumber, amount, dueDate, daysPastDue, notes }: UnpaidInvoiceProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Friendly reminder — Invoice {invoiceNumber || ''} is overdue</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Invoice Payment Reminder</Heading>
        <Text style={text}>
          Dear {clientName || 'Client'},
        </Text>
        <Text style={text}>
          I hope this finds you well. This is a friendly reminder that the following invoice is now {daysPastDue ? `${daysPastDue} days` : 'currently'} past due.
        </Text>
        <Hr style={hr} />
        <Section>
          {invoiceNumber && (
            <>
              <Text style={label}>Invoice Number</Text>
              <Text style={value}>{invoiceNumber}</Text>
            </>
          )}
          <Text style={label}>Amount Due</Text>
          <Text style={value}>{amount || 'See invoice'}</Text>
          {dueDate && (
            <>
              <Text style={label}>Original Due Date</Text>
              <Text style={value}>{dueDate}</Text>
            </>
          )}
        </Section>
        <Hr style={hr} />
        {notes && <Text style={text}>{notes}</Text>}
        <Text style={text}>
          If payment has already been made, please disregard this reminder. Otherwise, I'd appreciate it if you could arrange payment at your earliest convenience.
        </Text>
        <Text style={text}>
          Please feel free to contact me if you have any questions or need to discuss payment arrangements.
        </Text>
        <Text style={text}>
          Kind regards,{'\n'}Nick{'\n'}{SITE_NAME}{'\n'}0413 806 551
        </Text>
        <Text style={footer}>ABN: [Your ABN] | {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: UnpaidInvoiceEmail,
  subject: (data: Record<string, any>) => `Payment Reminder — Invoice ${data.invoiceNumber || 'Overdue'}`,
  displayName: 'Unpaid invoice follow-up',
  previewData: { clientName: 'Sarah Johnson', invoiceNumber: 'MGS-2026-015', amount: '$1,250.00 (inc GST)', dueDate: '20 March 2026', daysPastDue: '16', notes: '' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e3a2b', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px', whiteSpace: 'pre-line' as const }
const hr = { borderColor: '#e0e0e0', margin: '20px 0' }
const label = { fontSize: '12px', color: '#888888', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 2px', fontWeight: '600' as const }
const value = { fontSize: '15px', color: '#1e3a2b', margin: '0 0 14px' }
const footer = { fontSize: '12px', color: '#999999', margin: '20px 0 0' }
