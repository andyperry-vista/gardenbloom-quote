export interface VCardData {
  fullName: string;
  organization: string;
  title?: string;
  phone: string;
  email: string;
  website: string;
  note?: string;
}

export function buildVCard(data: VCardData): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${data.fullName}`,
    `N:${data.fullName.split(" ").reverse().join(";")};;;`,
    `ORG:${data.organization}`,
    data.title ? `TITLE:${data.title}` : "",
    `TEL;TYPE=CELL,VOICE:${data.phone.replace(/\s+/g, "")}`,
    `EMAIL;TYPE=INTERNET:${data.email}`,
    `URL:${data.website}`,
    data.note ? `NOTE:${data.note}` : "",
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\r\n");
}

export function downloadVCard(data: VCardData, filename = "contact.vcf") {
  const blob = new Blob([buildVCard(data)], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
