import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mayura Garden Services"

interface PaymentFollowupProps {
  clientName?: string
  invoiceNumber?: string
  amount?: string
  dueDate?: string
  notes?: string
}

const PaymentFollowupEmail = ({ clientName, invoiceNumber, amount, dueDate, notes }: PaymentFollowupProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Second reminder — Invoice {invoiceNumber || ''} payment outstanding</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Payment Follow-Up</Heading>
        <Text style={text}>
          Hi {clientName || 'there'},
        </Text>
        <Text style={text}>
          I'm following up on a previous reminder regarding the outstanding payment below. As this invoice is now overdue, I'd appreciate your prompt attention.
        </Text>
        <Hr style={hr} />
        <Section>
          {invoiceNumber && (
            <>
              <Text style={label}>Invoice Number</Text>
              <Text style={value}>{invoiceNumber}</Text>
            </>
          )}
          <Text style={label}>Amount Outstanding</Text>
          <Text style={value}>{amount || 'See invoice'}</Text>
          {dueDate && (
            <>
              <Text style={label}>Due Date</Text>
              <Text style={value}>{dueDate}</Text>
            </>
          )}
        </Section>
        <Hr style={hr} />
        {notes && <Text style={text}>{notes}</Text>}
        <Text style={text}>
          If payment has already been arranged, please disregard this message and accept my thanks. If not, please arrange payment as soon as possible or contact me directly to discuss.
        </Text>
        <Text style={text}>
          I value our working relationship and am happy to assist if there's anything holding up the payment.
        </Text>
        <Text style={text}>
          Kind regards,{'\n'}Nick{'\n'}{SITE_NAME}{'\n'}0413 806 551
        </Text>
        <Text style={footer}>ABN: 22 046 912 532 | {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PaymentFollowupEmail,
  subject: (data: Record<string, any>) => `Second Reminder — Invoice ${data.invoiceNumber || 'Outstanding'}`,
  displayName: 'Payment follow-up (second reminder)',
  previewData: { clientName: 'Sarah Johnson', invoiceNumber: 'MGS-2026-015', amount: '$1,250.00 (inc GST)', dueDate: '20 March 2026', notes: '' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e3a2b', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px', whiteSpace: 'pre-line' as const }
const hr = { borderColor: '#e0e0e0', margin: '20px 0' }
const label = { fontSize: '12px', color: '#888888', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 2px', fontWeight: '600' as const }
const value = { fontSize: '15px', color: '#1e3a2b', margin: '0 0 14px' }
const footer = { fontSize: '12px', color: '#999999', margin: '20px 0 0' }
