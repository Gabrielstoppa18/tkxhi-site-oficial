import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "Condições de uso do site da TkxHi e de matrícula nos cursos presenciais: pagamento, presença, reembolso e certificado.",
  alternates: { canonical: "/termos-de-uso" },
};

/**
 * Termos de uso do site e da matrícula nos cursos.
 *
 * Descreve o que o sistema de fato faz (ver docs/cursos.md). As condições de
 * reembolso de cada turma ficam no texto de ciência aceito na matrícula
 * (src/lib/consent.ts), que prevalece sobre este resumo. Revise com um
 * advogado antes de publicar em produção.
 */
const UPDATED_AT = "29 de setembro de 2026";

export default function TermsPage() {
  const email = siteConfig.contact.email;

  return (
    <LegalPage
      eyebrow={`Atualizados em ${UPDATED_AT}`}
      title="Termos de Uso"
      intro={
        <>
          Estes termos valem para quem usa o site da {siteConfig.name} e para
          quem se matricula nos cursos presenciais oferecidos por ele. Ao usar o
          site ou fazer uma matrícula, você concorda com eles.
        </>
      }
    >
      <LegalSection title="Quem somos">
        <p>
          <strong>{siteConfig.name}</strong>, CNPJ {siteConfig.cnpj}. Contato:{" "}
          <a href={`mailto:${email}`}>{email}</a>.
        </p>
      </LegalSection>

      <LegalSection title="Uso do site">
        <ul>
          <li>
            O conteúdo do site (textos, fotos, desenhos e marca) pertence à{" "}
            {siteConfig.name} e não pode ser copiado para fins comerciais sem
            autorização.
          </li>
          <li>
            Não é permitido tentar acessar áreas restritas, interferir no
            funcionamento do site ou automatizar pedidos de matrícula.
          </li>
          <li>
            O tratamento de dados pessoais segue a{" "}
            <Link href="/politica-de-privacidade">Política de Privacidade</Link>
            .
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Matrícula e pagamento">
        <ul>
          <li>
            A matrícula é feita pelo formulário da página do curso, com nome do
            aluno, e-mail e CPF de quem paga. O nome informado é o que sai no
            certificado.
          </li>
          <li>
            Antes de pagar, você lê e aceita as{" "}
            <strong>condições da turma</strong> (data, local, horário e política
            de reembolso). O texto aceito, a data e o endereço de conexão ficam
            registrados como comprovante.
          </li>
          <li>
            O pagamento é feito pelo Mercado Pago, por Pix ou cartão. A vaga só
            fica garantida depois que o pagamento é aprovado; enquanto isso, ela
            fica reservada por até 30 minutos.
          </li>
          <li>
            A confirmação, com data, local e o QR code de entrada, chega por
            e-mail. O QR code é pessoal.
          </li>
          <li>
            Quando o aluno for menor de 18 anos, a matrícula deve ser feita pelo
            responsável legal.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Presença e certificado">
        <ul>
          <li>
            A presença é registrada pela equipe no dia do curso, por check-in
            com o QR code ou pela lista da turma.
          </li>
          <li>
            Quem tem presença registrada recebe um certificado de participação
            em PDF, com um código que qualquer pessoa pode conferir no site.
          </li>
          <li>
            Os cursos são práticos, com equipamentos em funcionamento: siga as
            orientações de segurança dos instrutores durante a aula.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Desistência e reembolso">
        <ul>
          <li>
            <strong>Até 7 dias corridos após o pagamento</strong>, sem ter
            participado do curso, você pode desistir e recebe o valor integral
            de volta (Código de Defesa do Consumidor, art. 49).
          </li>
          <li>
            <strong>Depois dos 7 dias</strong>, vale a política de reembolso da
            turma, mostrada antes do pagamento e registrada no texto que você
            aceitou.
          </li>
          <li>
            <strong>Depois de participar do curso</strong>, o pedido de
            reembolso é analisado individualmente pela equipe, considerando que
            o serviço foi prestado.
          </li>
          <li>
            O pedido é feito em <Link href="/reembolso">/reembolso</Link>, com o
            e-mail da compra ou o número da matrícula. O prazo para o valor
            aparecer depende do meio de pagamento.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Mudança ou cancelamento da turma">
        <ul>
          <li>
            Se a {siteConfig.name} precisar mudar a data ou o local da turma,
            você é avisado por e-mail e pode escolher entre manter a matrícula
            ou receber o valor integral de volta.
          </li>
          <li>
            Se a turma for cancelada pela {siteConfig.name}, o valor pago é
            devolvido integralmente.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Responsabilidade">
        <p>
          A {siteConfig.name} se esforça para manter o site no ar e as
          informações corretas, mas o site pode ficar indisponível por
          manutenção ou falha de fornecedores. Nada nestes termos limita os
          direitos que o Código de Defesa do Consumidor garante a você.
        </p>
      </LegalSection>

      <LegalSection title="Mudanças e legislação">
        <p>
          Estes termos podem ser atualizados; a data no topo indica a versão em
          vigor. Matrículas já feitas seguem as condições aceitas no momento da
          compra. Vale a legislação brasileira, e eventuais conflitos podem ser
          levados ao foro do domicílio do consumidor.
        </p>
        <p>
          Dúvidas? Escreva para <a href={`mailto:${email}`}>{email}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
