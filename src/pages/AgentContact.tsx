import AgentLayout from "@/components/AgentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AgentContact() {
  return (
    <AgentLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Contact Us</h1>
          <p className="text-muted-foreground">Get in touch with the Mayura Garden Services team</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Direct Contact</CardTitle>
              <CardDescription>Reach out to Nick directly for urgent matters or general inquiries.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 border rounded-lg p-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone (Nick)</p>
                  <a href="tel:0413806551" className="font-medium hover:underline block">0413 806 551</a>
                </div>
              </div>
              <div className="flex items-center gap-3 border rounded-lg p-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a href="mailto:nicholas@mayuragardenservices.com.au" className="font-medium hover:underline block truncate max-w-[200px] sm:max-w-xs">
                    nicholas@mayuragardenservices.com.au
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connect on WeChat</CardTitle>
              <CardDescription>Scan the QR code below to connect with Nick Garden & Tree services.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <img 
                  src="/wechat-qr.jpg" 
                  alt="WeChat QR Code" 
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">Scan QR code to add me</p>
              <Button asChild variant="outline" className="mt-4 gap-2 border-[#07C160]/30 text-[#07C160] hover:bg-[#07C160]/10 hover:text-[#07C160]">
                <a href="weixin://">
                  <MessageCircle className="w-4 h-4" /> Open WeChat App
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AgentLayout>
  );
}
