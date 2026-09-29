import QRCode from "qrcode";
import { appUrl } from "@/lib/server/env";
import { isOpaqueToken } from "@/lib/server/tokens";

/**
 * Imagem do QR code de check-in, referenciada pelo e-mail de confirmação.
 * Não consulta o banco: só desenha a URL do token — quem tem o token já tem o
 * QR, e a página que ele abre exige login.
 */
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/checkin/qr/[token]">,
) {
  const { token } = await params;
  if (!isOpaqueToken(token)) {
    return new Response("token inválido", { status: 404 });
  }

  const png = await QRCode.toBuffer(`${appUrl()}/admin/checkin/${token}`, {
    width: 480,
    margin: 2,
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
