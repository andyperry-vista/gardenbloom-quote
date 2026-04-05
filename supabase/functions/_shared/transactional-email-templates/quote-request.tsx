import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Hr, Section, Button, Img,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Mayura Garden Services"

interface QuoteRequestProps {
  name?: string
  email?: string
  phone?: string
  address?: string
  message?: string
  photoUrl?: string
}

const QuoteRequestEmail = ({ name, email, phone, address, message, photoUrl }: QuoteRequestProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New quote request from {name || 'a potential client'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Quote Request</Heading>
        <Text style={text}>You've received a new quote request via the {SITE_NAME} website.</Text>
        <Hr style={hr} />
        <Section>
          <Text style={label}>Name</Text>
          <Text style={value}>{name || 'Not provided'}</Text>
          <Text style={label}>Email</Text>
          <Text style={value}>{email || 'Not provided'}</Text>
          {phone && (
            <>
              <Text style={label}>Phone</Text>
              <Text style={value}>{phone}</Text>
            </>
          )}
          {address && (
            <>
              <Text style={label}>Property Address</Text>
              <Text style={value}>{address}</Text>
            </>
          )}
          {message && (
            <>
              <Text style={label}>Message</Text>
              <Text style={value}>{message}</Text>
            </>
           )}
         </Section>
         {photoUrl && (
           <>
             <Hr style={hr} />
             <Text style={label}>Garden Photo</Text>
             <Img src={photoUrl} alt="Garden photo" width="100%" style={{ borderRadius: '8px', marginTop: '8px' }} />
           </>
         )}
         <Hr style={hr} />
         <Text style={footer}>This email was sent from the {SITE_NAME} website contact form.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: QuoteRequestEmail,
  subject: (data: Record<string, any>) => `New Quote Request from ${data.name || 'Website Visitor'}`,
  displayName: 'Quote request notification',
  previewData: { name: 'Jane Smith', email: 'jane@example.com', phone: '021 123 4567', address: '42 Garden Lane, Auckland', message: 'Looking to tidy up the front garden before listing.', photoUrl: 'https://placehold.co/600x400/2d5a3d/ffffff?text=Garden+Photo' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '24px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1e3a2b', margin: '0 0 16px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const hr = { borderColor: '#e0e0e0', margin: '20px 0' }
const label = { fontSize: '12px', color: '#888888', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 2px', fontWeight: '600' as const }
const value = { fontSize: '15px', color: '#1e3a2b', margin: '0 0 14px' }
const footer = { fontSize: '12px', color: '#999999', margin: '20px 0 0' }
