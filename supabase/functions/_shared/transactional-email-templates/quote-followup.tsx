import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mayura Garden Services"

interface QuoteFollowupProps {
  clientName?: string
  quoteNumber?: string
  quoteDate?: string
  propertyAddress?: string
  notes?: string
}

const QuoteFollowupEmail = ({ clientName, quoteNumber, quoteDate, propertyAddress, notes }: QuoteFollowupProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Following up on your garden quote{quoteNumber ? ` #${quoteNumber}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Quote Follow-Up</Heading>
        <Text style={text}>
          Hi {clientName || 'there'},
        </Text>
        <Text style={text}>
          I wanted to follow up on the quote I sent through{quoteDate ? ` on ${quoteDate}` : ''}{propertyAddress ? ` for the property at ${propertyAddress}` : ''}.
        </Text>
        <Text style={text}>
          I understand you may be busy, so I just wanted to check if you had any questions or if there's anything I can adjust to better suit your needs.
        </Text>
        {notes && <Text style={text}>{notes}</Text>}
        <Text style={text}>
          I'm happy to revise the quote or discuss different options that might work better for your budget and timeline.
        </Text>
        <Hr style={hr} />
        <Text style={text}>
          Kind regards,{'\n'}Nick{'\n'}{SITE_NAME}{'\n'}0413 806 551
        </Text>
        <Text style={footer}>{SITE_NAME} — Maximising Property Value</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: QuoteFollowupEmail,
  subject: (data: Record<string, any>) => `Following Up — Your Garden Quote${data.quoteNumber ? ` #${data.quoteNumber}` : ''}`,
  displayName: 'Quote follow-up',
  previewData: { clientName: 'David Chen', quoteNumber: 'Q-042', quoteDate: '28 March 2026', propertyAddress: '15 Rose St, Kew', notes: '' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e3a2b', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px', whiteSpace: 'pre-line' as const }
const hr = { borderColor: '#e0e0e0', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '20px 0 0' }
