import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mayura Garden Services"

interface BookingConfirmationProps {
  clientName?: string
  scheduledDate?: string
  propertyAddress?: string
  notes?: string
}

const BookingConfirmationEmail = ({ clientName, scheduledDate, propertyAddress, notes }: BookingConfirmationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your garden service booking is confirmed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Booking Confirmed</Heading>
        <Text style={text}>
          {clientName ? `Hi ${clientName},` : 'Hi,'} your garden service booking with {SITE_NAME} has been confirmed.
        </Text>
        <Hr style={hr} />
        <Section>
          {scheduledDate && (
            <>
              <Text style={label}>Scheduled Date</Text>
              <Text style={value}>{scheduledDate}</Text>
            </>
          )}
          {propertyAddress && (
            <>
              <Text style={label}>Property Address</Text>
              <Text style={value}>{propertyAddress}</Text>
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
          We'll be in touch before the scheduled date to confirm timing. If you need to reschedule, please reply to this email.
        </Text>
        <Text style={footer}>ABN: 22 046 912 532 | {SITE_NAME}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: BookingConfirmationEmail,
  subject: 'Your Garden Service Booking is Confirmed',
  displayName: 'Booking confirmation',
  previewData: { clientName: 'Sarah', scheduledDate: '15 April 2026', propertyAddress: '42 Garden Lane, Kew', notes: 'Full garden makeover including mulching and hedge trimming' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e3a2b', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const hr = { borderColor: '#e0e0e0', margin: '20px 0' }
const label = { fontSize: '12px', color: '#888888', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 2px', fontWeight: '600' as const }
const value = { fontSize: '15px', color: '#1e3a2b', margin: '0 0 14px' }
const footer = { fontSize: '12px', color: '#999999', margin: '20px 0 0' }
