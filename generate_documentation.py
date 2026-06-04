import os
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from pypdf import PdfReader, PdfWriter

def create_pdf(filename):
    doc = SimpleDocTemplate(filename, pagesize=letter,
                            rightMargin=72, leftMargin=72,
                            topMargin=72, bottomMargin=18)

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='Center', alignment=1))
    
    Story = []
    
    # Title Page
    Story.append(Spacer(1, 150))
    Story.append(Paragraph("Mayura Garden Services", styles['Title']))
    Story.append(Spacer(1, 20))
    Story.append(Paragraph("Platform Features Documentation", styles['Title']))
    Story.append(Spacer(1, 100))
    Story.append(Paragraph("Prepared for: Business Owner", styles['Heading2']))
    Story.append(Spacer(1, 20))
    Story.append(Paragraph("Prepared by: Andrew Perry (Webmaster)", styles['Heading2']))
    Story.append(PageBreak())
    
    base_dir = "/Users/andyperry/.gemini/antigravity/brain/ed26288e-30d4-4316-8826-8912a982b126/"
    
    # Section 1: Homepage
    Story.append(Paragraph("1. Homepage", styles['Heading1']))
    Story.append(Spacer(1, 12))
    Story.append(Paragraph("The newly updated Mayura Garden Services homepage provides an impactful first impression for prospective clients. It features a high-quality parallax hero image, ensuring that as users scroll, the background remains fixed, creating a modern and premium browsing experience. Below the hero section, an interactive 'Before and After' gallery allows users to tangibly see the value of pre-sale garden styling. A newly added 'Professional' shot highlights the final product ready for real-estate listings. The page also includes an intuitive lead-capture quote request form that utilizes seamless data handling to maximize conversion rates.", styles['Normal']))
    Story.append(Spacer(1, 12))
    
    # Add homepage screenshots
    homepage_imgs = [
        "landing_hero_section_1779092398901.png",
        "before_after_section_1779092474349.png",
        "landing_page_loaded_1779095043634.png"
    ]
    for img in homepage_imgs:
        path = os.path.join(base_dir, img)
        if os.path.exists(path):
            try:
                Story.append(KeepTogether([Image(path, width=400, height=250, kind='proportional'), Spacer(1, 12)]))
            except Exception as e:
                pass

    Story.append(PageBreak())
    
    # Section 2a: Admin Website
    Story.append(Paragraph("2a. Admin Website", styles['Heading1']))
    Story.append(Spacer(1, 12))
    Story.append(Paragraph("The Admin Website serves as the central command center for Mayura Garden Services. It features a comprehensive dashboard designed to manage all incoming quote requests, track ongoing jobs, and oversee business operations. An integrated photo management system allows the admin to dynamically update the 'Before and After' photos displayed on the homepage directly from the settings interface, eliminating the need for code changes. Additionally, robust quoting tools enable the admin to efficiently compile materials and generate accurate quotes for clients.", styles['Normal']))
    Story.append(Spacer(1, 12))
    Story.append(PageBreak())
    
    # Section 2b: Admin Phone Application
    Story.append(Paragraph("2b. Admin Phone Application", styles['Heading1']))
    Story.append(Spacer(1, 12))
    Story.append(Paragraph("The Admin Phone Application provides critical on-the-go access to business operations. Designed for field use, it allows the admin to view upcoming schedules, access detailed job information, and receive real-time updates and notifications regarding new quote requests. The mobile-optimized interface ensures that quick adjustments, such as updating job statuses or communicating with team members, can be performed efficiently from anywhere, ensuring operational continuity.", styles['Normal']))
    Story.append(Spacer(1, 12))
    
    admin_mobile_imgs = [
        "media__1779201742185.png",
        "media__1779201742190.png"
    ]
    for img in admin_mobile_imgs:
        path = os.path.join(base_dir, img)
        if os.path.exists(path):
            try:
                Story.append(KeepTogether([Image(path, width=200, height=400, kind='proportional'), Spacer(1, 12)]))
            except Exception as e:
                pass
    Story.append(PageBreak())

    # Section 3a: Agent Website
    Story.append(Paragraph("3a. Agent Website", styles['Heading1']))
    Story.append(Spacer(1, 12))
    Story.append(Paragraph("The Agent Website is a dedicated portal tailored for real estate agents who partner with Mayura Garden Services. It streamlines the process for agents to submit priority quote requests for their property listings. The portal includes specific 'Contact Us' features for direct communication and support, fostering strong B2B relationships. Agents can also access an overview of their past projects and current job statuses, providing them with transparency and peace of mind regarding the properties they manage.", styles['Normal']))
    Story.append(Spacer(1, 12))
    Story.append(PageBreak())

    # Section 3b: Agent Phone Application
    Story.append(Paragraph("3b. Agent Phone Application", styles['Heading1']))
    Story.append(Spacer(1, 12))
    Story.append(Paragraph("The Agent Phone Application empowers real estate agents to interact with Mayura Garden Services directly from their mobile devices. It features rapid address submission capabilities, integrated with Google Maps autocomplete, to ensure quick and accurate quoting for new properties. Agents can track the real-time progress of jobs on their managed properties, enabling them to stay informed and provide timely updates to their clients.", styles['Normal']))
    Story.append(Spacer(1, 12))
    
    agent_mobile_imgs = [
        "media__1779201742207.png",
        "media__1779201742219.png",
        "media__1779201742257.png"
    ]
    for img in agent_mobile_imgs:
        path = os.path.join(base_dir, img)
        if os.path.exists(path):
            try:
                Story.append(KeepTogether([Image(path, width=200, height=400, kind='proportional'), Spacer(1, 12)]))
            except Exception as e:
                pass

    doc.build(Story)

def ensure_multiple_of_four(input_pdf, output_pdf):
    reader = PdfReader(input_pdf)
    writer = PdfWriter()
    
    for page in reader.pages:
        writer.add_page(page)
        
    num_pages = len(reader.pages)
    remainder = num_pages % 4
    
    if remainder != 0:
        pages_to_add = 4 - remainder
        for _ in range(pages_to_add):
            writer.add_blank_page(width=612, height=792) # Letter size
            
    with open(output_pdf, "wb") as f:
        writer.write(f)

if __name__ == "__main__":
    temp_pdf = "temp_documentation.pdf"
    final_pdf = "Mayura_Garden_Services_Documentation.pdf"
    create_pdf(temp_pdf)
    ensure_multiple_of_four(temp_pdf, final_pdf)
    if os.path.exists(temp_pdf):
        os.remove(temp_pdf)
    print(f"Documentation generated: {final_pdf}")
