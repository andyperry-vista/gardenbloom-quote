import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mayura Garden Services"

interface RateReviewProps {
  clientName?: string
  propertyAddress?: string
}

const RateReviewEmail = ({ clientName, propertyAddress }: RateReviewProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We'd love your feedback on our garden service</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>How Did We Do?</Heading>
        <Text style={text}>
          {clientName ? `Hi ${clientName},` : 'Hi,'} thank you for choosing {SITE_NAME}
          {propertyAddress ? ` for the work at ${propertyAddress}` : ''}.
        </Text>
        <Text style={text}>
          We'd really appreciate it if you could take a moment to share your experience. Your feedback helps us improve and helps other homeowners find quality garden services.
        </Text>
        <Hr style={hr} />
        <Text style={text}>
          Simply reply to this email with your thoughts, or leave us a Google review. We truly value your opinion!
        </Text>
        <Text style={footer}>Warm regards, The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RateReviewEmail,
  subject: "We'd Love Your Feedback!",
  displayName: 'Rate & review request',
  previewData: { clientName: 'David', propertyAddress: '8 Elm Ave, Richmond' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e3a2b', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const hr = { borderColor: '#e0e0e0', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '20px 0 0' }
