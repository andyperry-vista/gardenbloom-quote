import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Button, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mayura Garden Services"

interface QuoteReadyProps {
  clientName?: string
  quoteNumber?: string
  quoteTotal?: string
  propertyAddress?: string
  introMessage?: string
  quoteUrl?: string
}

const QuoteReadyEmail = ({
  clientName,
  quoteNumber,
  quoteTotal,
  propertyAddress,
  introMessage,
  quoteUrl,
}: QuoteReadyProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      Your garden quote{quoteNumber ? ` #${quoteNumber}` : ''} is ready
      {quoteTotal ? ` — ${quoteTotal}` : ''}
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your Garden Quote is Ready</Heading>
        <Text style={text}>Hi {clientName || 'there'},</Text>

        {introMessage ? (
          <Text style={text}>{introMessage}</Text>
        ) : (
          <Text style={text}>
            Thank you for the opportunity to quote on
            {propertyAddress ? ` ${propertyAddress}` : ' your garden'}.
            Please find the details of your tailored quote below.
          </Text>
        )}

        <Section style={summary}>
          {quoteNumber && (
            <>
              <Text style={label}>Quote Number</Text>
              <Text style={value}>#{quoteNumber}</Text>
            </>
          )}
          {propertyAddress && (
            <>
              <Text style={label}>Property</Text>
              <Text style={value}>{propertyAddress}</Text>
            </>
          )}
          {quoteTotal && (
            <>
              <Text style={label}>Total (incl. GST)</Text>
              <Text style={totalValue}>{quoteTotal}</Text>
            </>
          )}
        </Section>

        {quoteUrl && (
          <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
            <Button href={quoteUrl} style={button}>View Your Quote</Button>
          </Section>
        )}

        <Hr style={hr} />
        <Text style={text}>
          If you have any questions, would like to adjust the scope, or are ready to
          go ahead, just reply to this email or give me a call.
        </Text>
        <Text style={text}>
          Kind regards,{'\n'}Nick{'\n'}{SITE_NAME}{'\n'}0413 806 551
        </Text>
        <Text style={footer}>{SITE_NAME} — ABN 22 046 912 532</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: QuoteReadyEmail,
  subject: (data: Record<string, any>) =>
    data.subject ||
    `Your Garden Quote${data.quoteNumber ? ` #${data.quoteNumber}` : ''} from ${SITE_NAME}`,
  displayName: 'Quote ready (to client)',
  previewData: {
    clientName: 'Sarah Mitchell',
    quoteNumber: 'Q-042',
    quoteTotal: '$3,450.00',
    propertyAddress: '15 Rose St, Kew',
    introMessage: 'It was lovely meeting you at the property today. As discussed, here is the quote for the pre-sale garden styling work.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '600px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#052A1D', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px', whiteSpace: 'pre-line' as const }
const summary = { backgroundColor: '#f7f6f1', borderLeft: '3px solid #BFA358', padding: '16px 18px', margin: '20px 0' }
const label = { fontSize: '11px', color: '#888888', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 2px', fontWeight: '600' as const }
const value = { fontSize: '15px', color: '#052A1D', margin: '0 0 12px' }
const totalValue = { fontSize: '20px', color: '#052A1D', margin: '0 0 4px', fontWeight: 'bold' as const }
const button = { backgroundColor: '#052A1D', color: '#ffffff', padding: '12px 28px', borderRadius: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' as const, display: 'inline-block' }
const hr = { borderColor: '#e0e0e0', margin: '24px 0' }
const footer = { fontSize: '11px', color: '#999999', margin: '20px 0 0', textAlign: 'center' as const }
