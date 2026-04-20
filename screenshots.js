import { chromium } from '@playwright/test';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  const routes = [
    { path: '/', name: '01_Landing_Page', title: 'Landing Page' },
    { path: '/admin/login', name: '02_Admin_Login', title: 'Admin Login' },
    { path: '/admin', name: '03_Admin_Dashboard', title: 'Admin Dashboard' },
    { path: '/admin/quotes/new', name: '04_Quote_Editor', title: 'Quote Editor' },
    { path: '/admin/jobs', name: '05_Jobs_Management', title: 'Jobs Management' },
    { path: '/admin/clients', name: '06_Client_Management', title: 'Client Management' },
    { path: '/agent/login', name: '07_Agent_Login', title: 'Agent Login' },
    { path: '/agent', name: '08_Agent_Dashboard', title: 'Agent Dashboard' },
    { path: '/agent/request', name: '09_Agent_Quote_Request', title: 'Agent Quote Request' },
  ];

  if (!fs.existsSync('screenshots')) {
    fs.mkdirSync('screenshots');
  }

  for (const route of routes) {
    try {
      await page.goto(`http://localhost:8080${route.path}`, { waitUntil: 'networkidle' });
      // Wait a bit for animations or react query to settle
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `screenshots/${route.name}.png` });
      console.log(`Captured ${route.name}`);
    } catch (e) {
      console.error(`Failed to capture ${route.name}:`, e);
    }
  }

  await browser.close();
})();
