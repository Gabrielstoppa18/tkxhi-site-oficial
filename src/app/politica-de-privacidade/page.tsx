import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal-page";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a TkxHi coleta, usa, guarda e protege os dados pessoais de quem se matricula nos cursos e usa o site, conforme a LGPD.",
  alternates: { canonical: "/politica-de-privacidade" },
};

/**
 * Política de privacidade (LGPD, Lei 13.709/2018).
 *
 * Descreve o que o sistema de fato faz — ao mudar a coleta, o armazenamento
 * ou um fornecedor, atualize esta página e a data abaixo. Revise o texto com
 * um advogado antes de publicar em produção.
 */
const UPDATED_AT = "28 de setembro de 2026";

const processors = [
  {
    name: "Mercado Pago",
    role: "processamento do pagamento (Pix ou cartão) e dos reembolsos",
  },
  {
    name: "Resend",
    role: "envio dos e-mails de confirmação, certificado e reembolso",
  },
  { name: "Vercel", role: "hospedagem do site" },
  { name: "Supabase", role: "banco de dados das matrículas" },
];

export default function PrivacyPolicyPage() {
  const email = siteConfig.contact.email;

  return (
    <LegalPage
      eyebrow={`LGPD · Atualizada em ${UPDATED_AT}`}
      title="Política de Privacidade"
      intro={
        <>
          Esta política explica quais dados pessoais a {siteConfig.name} coleta,
          para quê, com quem compartilha, por quanto tempo guarda e como você
          exerce os seus direitos previstos na Lei Geral de Proteção de Dados
          (Lei 13.709/2018).
        </>
      }
    >
      <LegalSection title="Quem é responsável pelos seus dados">
        <p>
          <strong>{siteConfig.name}</strong>, CNPJ {siteConfig.cnpj}, é a
          controladora dos dados tratados neste site. Para qualquer assunto
          sobre privacidade, escreva para{" "}
          <a
            href={`mailto:${email}`}
            className="text-primary underline underline-offset-4"
          >
            {email}
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Quais dados coletamos">
        <p>
          <strong>Na matrícula em um curso:</strong>
        </p>
        <ul>
          <li>nome completo do aluno, usado no certificado;</li>
          <li>e-mail, para enviar a confirmação e o QR code de entrada;</li>
          <li>CPF, exigido para o pagamento;</li>
          <li>
            o registro da sua ciência das condições da matrícula: o texto
            aceito, a data e a hora, o endereço IP e o navegador usados.
          </li>
        </ul>
        <p>
          <strong>No pagamento:</strong> o pagamento é feito no ambiente do
          Mercado Pago. Recebemos o número, a situação e o valor do pagamento.{" "}
          <strong>Não recebemos nem guardamos</strong> número de cartão, código
          de segurança ou senha.
        </p>
        <p>
          <strong>No dia do curso:</strong> o registro de presença (check-in),
          com a data, a hora e quem da equipe registrou.
        </p>
        <p>
          <strong>Em pedidos de reembolso:</strong> a data do pedido, a decisão
          e o valor devolvido.
        </p>
        <p>
          <strong>Na navegação:</strong> o site não usa cookies de rastreamento,
          publicidade ou análise de audiência. O único cookie é o de sessão do
          painel interno, usado só pela equipe. A hospedagem registra dados
          técnicos de acesso (como endereço IP e página visitada) por tempo
          curto, para segurança e funcionamento.
        </p>
      </LegalSection>

      <LegalSection title="Para que usamos e com qual base legal">
        <ul>
          <li>
            <strong>Realizar a matrícula, o curso e o certificado</strong> —
            execução do contrato (art. 7º, V).
          </li>
          <li>
            <strong>Processar pagamento e reembolso</strong> — execução do
            contrato (art. 7º, V). O CPF é exigido pelo meio de pagamento.
          </li>
          <li>
            <strong>Cumprir obrigações legais e fiscais</strong> — art. 7º, II.
          </li>
          <li>
            <strong>
              Comprovar a ciência das condições, a presença e o pagamento
            </strong>{" "}
            em reclamações, pedidos de reembolso e contestações de pagamento —
            exercício regular de direitos (art. 7º, VI).
          </li>
          <li>
            <strong>Prevenir fraude e abuso</strong>, como limitar tentativas
            repetidas no pagamento e no acesso ao painel — legítimo interesse
            (art. 7º, IX).
          </li>
        </ul>
        <p>Não vendemos dados pessoais nem os usamos para publicidade.</p>
      </LegalSection>

      <LegalSection title="Com quem compartilhamos">
        <p>
          Só com os fornecedores necessários para o serviço funcionar, que
          tratam os dados em nosso nome:
        </p>
        <ul>
          {processors.map((item) => (
            <li key={item.name}>
              <strong>{item.name}</strong>: {item.role};
            </li>
          ))}
        </ul>
        <p>
          Alguns desses fornecedores processam dados fora do Brasil. Nesses
          casos, a transferência segue o artigo 33 da LGPD, com fornecedores que
          se comprometem com níveis de proteção compatíveis com a lei. Também
          podemos compartilhar dados com autoridades quando houver obrigação
          legal ou ordem judicial.
        </p>
      </LegalSection>

      <LegalSection title="Por quanto tempo guardamos">
        <p>
          Os registros de matrícula (pagas ou não), ciência, presença, pagamento
          e reembolso são guardados por até{" "}
          <strong>5 anos após a data da turma</strong>. É o prazo em que podem
          ser necessários para responder a reclamações de consumo (Código de
          Defesa do Consumidor, art. 27), contestações de pagamento e obrigações
          fiscais. Depois disso, são eliminados ou anonimizados.
        </p>
        <p>
          A página pública de verificação do certificado mostra só o nome do
          aluno, o curso e as datas, e fica disponível pelo mesmo prazo.
        </p>
      </LegalSection>

      <LegalSection title="Como protegemos">
        <ul>
          <li>todo acesso ao site é feito por conexão cifrada (HTTPS);</li>
          <li>o CPF fica cifrado no banco de dados;</li>
          <li>
            o painel da equipe exige senha e verificação em duas etapas, e
            bloqueia tentativas repetidas de acesso;
          </li>
          <li>
            as ações sobre matrículas ficam registradas, com data e autor, num
            histórico que não pode ser alterado.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Seus direitos">
        <p>Pela LGPD (art. 18), você pode pedir, a qualquer momento:</p>
        <ul>
          <li>confirmação de que tratamos seus dados e acesso a eles;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>
            anonimização, bloqueio ou eliminação de dados desnecessários ou
            tratados em desacordo com a lei;
          </li>
          <li>portabilidade dos dados a outro fornecedor;</li>
          <li>informação sobre com quem compartilhamos seus dados;</li>
          <li>eliminação dos dados, observados os prazos legais acima.</li>
        </ul>
        <p>
          Para exercer qualquer desses direitos, escreva para{" "}
          <a
            href={`mailto:${email}`}
            className="text-primary underline underline-offset-4"
          >
            {email}
          </a>{" "}
          a partir do e-mail usado na matrícula. Respondemos em até 15 dias.
          Alguns dados podem precisar ser mantidos mesmo após o pedido, quando a
          lei exigir ou para defesa em processos; nesse caso, explicamos o
          motivo. Você também pode reclamar à Autoridade Nacional de Proteção de
          Dados (ANPD).
        </p>
      </LegalSection>

      <LegalSection title="Alunos menores de idade">
        <p>
          Quando o aluno for menor de 18 anos, a matrícula deve ser feita por
          pai, mãe ou responsável legal, que informa o próprio e-mail e CPF para
          o pagamento e dá a ciência das condições em nome do aluno.
        </p>
      </LegalSection>

      <LegalSection title="Mudanças nesta política">
        <p>
          Quando esta política mudar, a data no topo da página é atualizada.
          Mudanças que afetem matrículas já feitas são comunicadas por e-mail.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
