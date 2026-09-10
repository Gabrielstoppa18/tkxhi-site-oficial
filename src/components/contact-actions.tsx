import { Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig, whatsappUrl } from "@/lib/site-config";

/**
 * Os caminhos de contato do site, num lugar só. O botão de WhatsApp só existe
 * quando há número configurado — melhor não ter botão do que ter um que abre
 * uma conversa com ninguém.
 */
export function ContactActions({ className }: { className?: string }) {
  const whatsapp = whatsappUrl();

  return (
    <div className={"flex flex-wrap gap-3 " + (className ?? "")}>
      {whatsapp ? (
        <Button asChild size="lg">
          <a href={whatsapp} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden />
            Conversar no WhatsApp
          </a>
        </Button>
      ) : null}
      <Button asChild size="lg" variant={whatsapp ? "outline" : "default"}>
        <a href={`mailto:${siteConfig.contact.email}`}>
          <Mail aria-hidden />
          {siteConfig.contact.email}
        </a>
      </Button>
    </div>
  );
}
