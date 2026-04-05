import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mayura Garden Services"

interface JobCompletionProps {
  clientName?: string
  propertyAddress?: string
  workCompleted?: string
  invoiceAmount?: string
  notes?: string
}

const JobCompletionEmail = ({ clientName, propertyAddress, workCompleted, invoiceAmount, notes }: JobCompletionProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your garden work at {propertyAddress || 'your property'} is complete</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Job Completed</Heading>
        <Text style={text}>
          Hi {clientName || 'there'},
        </Text>
        <Text style={text}>
          Great news — the garden work{propertyAddress ? ` at ${propertyAddress}` : ''} has been completed.
        </Text>
        <Hr style={hr} />
        <Section>
          {propertyAddress && (
            <>
              <Text style={label}>Property</Text>
              <Text style={value}>{propertyAddress}</Text>
            </>
          )}
          {workCompleted && (
            <>
              <Text style={label}>Work Completed</Text>
              <Text style={value}>{workCompleted}</Text>
            </>
          )}
          {invoiceAmount && (
            <>
              <Text style={label}>Invoice Amount</Text>
              <Text style={value}>{invoiceAmount}</Text>
            </>
          )}
        </Section>
        <Hr style={hr} />
        {notes && <Text style={text}>{notes}</Text>}
        <Text style={text}>
          The property is now ready for photography. If you'd like any touch-ups or additional work, please don't hesitate to reach out.
        </Text>
        <Text style={text}>
          Thank you for choosing {SITE_NAME} — I appreciate your business!
        </Text>
        <Text style={text}>
          Kind regards,{'\n'}Nick{'\n'}{SITE_NAME}{'\n'}0413 806 551
        </Text>
        <Text style={footer}>{SITE_NAME} — Maximising Property Value</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: JobCompletionEmail,
  subject: (data: Record<string, any>) => `Job Complete — ${data.propertyAddress || 'Your Garden Work'}`,
  displayName: 'Job completion notice',
  previewData: { clientName: 'Lisa Wang', propertyAddress: '8 Elm Ave, Richmond', workCompleted: 'Full garden clean-up, hedge trimming, mulching, lawn mow', invoiceAmount: '$980.00 (inc GST)', notes: '' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e3a2b', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px', whiteSpace: 'pre-line' as const }
const hr = { borderColor: '#e0e0e0', margin: '20px 0' }
const label = { fontSize: '12px', color: '#888888', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 2px', fontWeight: '600' as const }
const value = { fontSize: '15px', color: '#1e3a2b', margin: '0 0 14px' }
const footer = { fontSize: '12px', color: '#999999', margin: '20px 0 0' }
