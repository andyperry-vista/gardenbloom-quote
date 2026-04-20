import { jsPDF } from "jspdf";
import fs from "fs";

const doc = new jsPDF();
const routes = [
    { name: '01_Landing_Page', title: 'Landing Page', desc: 'The public-facing marketing and information page for Mayura Garden Services.' },
    { name: '02_Admin_Login', title: 'Admin Login', desc: 'Secure login portal for system administrators.' },
    { name: '03_Admin_Dashboard', title: 'Admin Dashboard', desc: 'Overview of operations, revenue, and active jobs for admins.' },
    { name: '04_Quote_Editor', title: 'Quote Editor', desc: 'Tool for creating and modifying customer quotes.' },
    { name: '05_Jobs_Management', title: 'Jobs Management', desc: 'Tracking and management of active and completed gardening jobs.' },
    { name: '06_Client_Management', title: 'Client Management', desc: 'Database of clients and their interaction history.' },
    { name: '07_Agent_Login', title: 'Agent Login', desc: 'Login portal for affiliate agents and partners.' },
    { name: '08_Agent_Dashboard', title: 'Agent Dashboard', desc: 'Overview of referrals and earned commissions for agents.' },
    { name: '09_Agent_Quote_Request', title: 'Agent Quote Request', desc: 'Form for agents to submit new quote requests on behalf of clients.' },
];

let yOffset = 20;

doc.setFontSize(24);
doc.text("Mayura Gardening Site - Feature Guide", 20, yOffset);
yOffset += 20;

for (const route of routes) {
  if (yOffset > 200) {
    doc.addPage();
    yOffset = 20;
  }
  doc.setFontSize(16);
  doc.text(route.title, 20, yOffset);
  yOffset += 10;
  
  doc.setFontSize(12);
  const splitDesc = doc.splitTextToSize(route.desc, 170);
  doc.text(splitDesc, 20, yOffset);
  yOffset += (splitDesc.length * 7) + 5;
  
  try {
    const b64 = fs.readFileSync(`screenshots/${route.name}.png`, 'base64');
    const imgData = `data:image/png;base64,${b64}`;
    
    // Scale image to fit width (170)
    // 1280x800 aspect ratio is 1.6. Height for 170 width is 170/1.6 = 106.25
    doc.addImage(imgData, 'PNG', 20, yOffset, 170, 106.25);
    yOffset += 115;
  } catch(e) {
    doc.text("(Screenshot not available)", 20, yOffset);
    yOffset += 10;
  }
}

fs.writeFileSync("Mayura_Feature_Guide.pdf", Buffer.from(doc.output('arraybuffer')));
console.log("Mayura_Feature_Guide.pdf generated successfully!");
