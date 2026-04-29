import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Button, Section, Row, Column,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mayura Garden Services"

interface QuoteLine {
  description: string
  quantity: number
  unitPrice: string  // formatted
  total: string      // formatted
}

interface QuoteReadyProps {
  clientName?: string
  quoteNumber?: string
  quoteTotal?: string
  propertyAddress?: string
  introMessage?: string
  quoteUrl?: string
  lineItems?: QuoteLine[]
  subtotal?: string
  discountLabel?: string
  discountAmount?: string
  notes?: string
}

const QuoteReadyEmail = ({
  clientName,
  quoteNumber,
  quoteTotal,
  propertyAddress,
  introMessage,
  quoteUrl,
  lineItems,
  subtotal,
  discountLabel,
  discountAmount,
  notes,
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
        </Section>

        {lineItems && lineItems.length > 0 && (
          <Section style={{ margin: '20px 0 8px' }}>
            <Heading as="h2" style={h2}>Quote Breakdown</Heading>
            <Section style={tableHead}>
              <Row>
                <Column style={thDesc}>Description</Column>
                <Column style={thQty}>Qty</Column>
                <Column style={thPrice}>Unit</Column>
                <Column style={thTotal}>Total</Column>
              </Row>
            </Section>
            {lineItems.map((item, i) => (
              <Section key={i} style={tableRow}>
                <Row>
                  <Column style={tdDesc}>{item.description}</Column>
                  <Column style={tdQty}>{item.quantity}</Column>
                  <Column style={tdPrice}>{item.unitPrice}</Column>
                  <Column style={tdTotal}>{item.total}</Column>
                </Row>
              </Section>
            ))}

            <Section style={totalsBox}>
              {subtotal && (
                <Row>
                  <Column style={totalsLabel}>Subtotal</Column>
                  <Column style={totalsValue}>{subtotal}</Column>
                </Row>
              )}
              {discountAmount && (
                <Row>
                  <Column style={totalsLabel}>{discountLabel || 'Discount'}</Column>
                  <Column style={{ ...totalsValue, color: '#b91c1c' }}>−{discountAmount}</Column>
                </Row>
              )}
              {quoteTotal && (
                <Row>
                  <Column style={grandLabel}>Total (incl. GST)</Column>
                  <Column style={grandValue}>{quoteTotal}</Column>
                </Row>
              )}
            </Section>
          </Section>
        )}

        {notes && (
          <Section style={notesBox}>
            <Text style={label}>Notes</Text>
            <Text style={{ ...text, margin: 0 }}>{notes}</Text>
          </Section>
        )}

        {quoteUrl && (
          <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
            <Button href={quoteUrl} style={button}>View Your Quote Online</Button>
          </Section>
        )}

        <Hr style={hr} />
        <Text style={text}>
          A PDF copy of this quote is attached. If you have any questions, would like
          to adjust the scope, or are ready to go ahead, just reply to this email or
          give me a call.
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
    lineItems: [
      { description: 'Premium hardwood mulch (delivered & spread)', quantity: 4, unitPrice: '$95.00', total: '$380.00' },
      { description: 'Hedge trimming — front & side', quantity: 6, unitPrice: '$85.00', total: '$510.00' },
      { description: 'Garden bed weeding & tidy', quantity: 8, unitPrice: '$75.00', total: '$600.00' },
      { description: 'Native plant installation (15 plants)', quantity: 1, unitPrice: '$1,960.00', total: '$1,960.00' },
    ],
    subtotal: '$3,450.00',
    notes: 'Quote valid for 30 days. Includes green waste removal.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '640px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#052A1D', margin: '0 0 20px' }
const h2 = { fontSize: '16px', fontWeight: 'bold' as const, color: '#052A1D', margin: '0 0 12px', borderBottom: '2px solid #BFA358', paddingBottom: '6px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.6', margin: '0 0 16px', whiteSpace: 'pre-line' as const }
const summary = { backgroundColor: '#f7f6f1', borderLeft: '3px solid #BFA358', padding: '14px 18px', margin: '20px 0' }
const label = { fontSize: '11px', color: '#888888', textTransform: 'uppercase' as const, letterSpacing: '0.06em', margin: '0 0 2px', fontWeight: '600' as const }
const value = { fontSize: '15px', color: '#052A1D', margin: '0 0 10px' }

const tableHead = { borderBottom: '1px solid #052A1D', padding: '0 0 6px' }
const tableRow = { borderBottom: '1px solid #eeeeee', padding: '8px 0' }
const thBase = { fontSize: '11px', color: '#888888', textTransform: 'uppercase' as const, letterSpacing: '0.05em', fontWeight: '600' as const, padding: '0 4px' }
const thDesc = { ...thBase, width: '55%' }
const thQty = { ...thBase, width: '10%', textAlign: 'right' as const }
const thPrice = { ...thBase, width: '15%', textAlign: 'right' as const }
const thTotal = { ...thBase, width: '20%', textAlign: 'right' as const }
const tdBase = { fontSize: '13px', color: '#333', padding: '8px 4px', verticalAlign: 'top' as const }
const tdDesc = { ...tdBase, width: '55%' }
const tdQty = { ...tdBase, width: '10%', textAlign: 'right' as const }
const tdPrice = { ...tdBase, width: '15%', textAlign: 'right' as const }
const tdTotal = { ...tdBase, width: '20%', textAlign: 'right' as const, fontWeight: '600' as const }

const totalsBox = { marginTop: '12px', padding: '8px 4px 0' }
const totalsLabel = { fontSize: '13px', color: '#55575d', padding: '4px 4px', textAlign: 'right' as const, width: '80%' }
const totalsValue = { fontSize: '13px', color: '#333', padding: '4px 4px', textAlign: 'right' as const, width: '20%' }
const grandLabel = { fontSize: '15px', color: '#052A1D', padding: '10px 4px 4px', textAlign: 'right' as const, width: '80%', fontWeight: 'bold' as const, borderTop: '2px solid #052A1D' }
const grandValue = { fontSize: '17px', color: '#052A1D', padding: '10px 4px 4px', textAlign: 'right' as const, width: '20%', fontWeight: 'bold' as const, borderTop: '2px solid #052A1D' }

const notesBox = { backgroundColor: '#fafaf7', borderRadius: '4px', padding: '12px 14px', margin: '20px 0' }
const button = { backgroundColor: '#052A1D', color: '#ffffff', padding: '12px 28px', borderRadius: '4px', textDecoration: 'none', fontSize: '14px', fontWeight: 'bold' as const, display: 'inline-block' }
const hr = { borderColor: '#e0e0e0', margin: '24px 0' }
const footer = { fontSize: '11px', color: '#999999', margin: '20px 0 0', textAlign: 'center' as const }
