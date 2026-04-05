import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mayura Garden Services"

interface PaymentRemittanceProps {
  recipientName?: string
  invoiceNumber?: string
  amount?: string
  paymentDate?: string
  paymentMethod?: string
  notes?: string
}

const PaymentRemittanceEmail = ({ recipientName, invoiceNumber, amount, paymentDate, paymentMethod, notes }: PaymentRemittanceProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Payment remittance advice for invoice {invoiceNumber || ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Payment Remittance Advice</Heading>
        <Text style={text}>
          Dear {recipientName || 'Supplier'},
        </Text>
        <Text style={text}>
          Please find below the details of our payment.
        </Text>
        <Hr style={hr} />
        <Section>
          {invoiceNumber && (
            <>
              <Text style={label}>Invoice Number</Text>
              <Text style={value}>{invoiceNumber}</Text>
            </>
          )}
          <Text style={label}>Amount Paid</Text>
          <Text style={value}>{amount || 'See attached'}</Text>
          <Text style={label}>Payment Date</Text>
          <Text style={value}>{paymentDate || 'Today'}</Text>
          {paymentMethod && (
            <>
              <Text style={label}>Payment Method</Text>
              <Text style={value}>{paymentMethod}</Text>
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
          If you have any questions regarding this payment, please don't hesitate to contact us.
        </Text>
        <Text style={text}>
          Kind regards,{'\n'}Nick{'\n'}{SITE_NAME}
        </Text>
        <Text style={footer}>ABN: [Your ABN] | {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PaymentRemittanceEmail,
  subject: (data: Record<string, any>) => `Payment Remittance — Invoice ${data.invoiceNumber || 'N/A'}`,
  displayName: 'Payment remittance advice',
  previewData: { recipientName: 'Bunnings Trade', invoiceNumber: 'INV-2026-042', amount: '$385.00', paymentDate: '5 April 2026', paymentMethod: 'Bank Transfer', notes: 'Payment for mulch and soil order' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e3a2b', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px', whiteSpace: 'pre-line' as const }
const hr = { borderColor: '#e0e0e0', margin: '20px 0' }
const label = { fontSize: '12px', color: '#888888', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 2px', fontWeight: '600' as const }
const value = { fontSize: '15px', color: '#1e3a2b', margin: '0 0 14px' }
const footer = { fontSize: '12px', color: '#999999', margin: '20px 0 0' }
