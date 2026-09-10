/**
 * Fotos e reproduções do trabalho real da TkxHi, em public/images/.
 *
 * Substituíram as imagens de banco que ocupavam esses lugares. Os arquivos
 * originais foram renomeados para kebab-case, tiveram a rotação de câmera
 * aplicada e foram reduzidos para no máximo 1800 px — 9,4 MB viraram 1,8 MB.
 *
 * Texto alternativo descreve o que a foto mostra, não o que ela significa:
 * quem usa leitor de tela precisa da cena, não da legenda de marketing.
 */
const dir = "/images";

export const photos = {
  // TurTle-T: o robô educacional, da bancada à peça montada.
  turtleCompleto: {
    src: `${dir}/turtle-t-completo.jpg`,
    alt: "Robô TurTle-T montado: cúpula laranja vazada impressa em 3D, esteiras pretas e cabeça verde com dois sensores ultrassônicos.",
  },
  turtleSensor: {
    src: `${dir}/turtle-t-sensor.jpg`,
    alt: "Close da cabeça do TurTle-T: sensor ultrassônico em suporte verde impresso, com presilhas laranja e sensor infravermelho abaixo.",
  },
  turtleBancada: {
    src: `${dir}/turtle-t-bancada.jpg`,
    alt: "TurTle-T sobre a bancada, cercado de placas Arduino, ESP32 e barras de pinos.",
  },
  turtleMontagem: {
    src: `${dir}/turtle-t-montagem.jpg`,
    alt: "Mãos encaixando o módulo de sensores no chassi impresso, com outros robôs e componentes sobre a mesa.",
  },
  turtleMesa: {
    src: `${dir}/turtle-t-mesa.jpg`,
    alt: "TurTle-T visto de frente sobre a mesa, com a fiação colorida à mostra e material didático ao fundo.",
  },

  // Editora: as capas da série Robótica Trip.
  capaTrip1: {
    src: `${dir}/capa-trip-1.jpg`,
    alt: "Capa de Robótica Trip 1, Pack 1: robô azul em fundo roxo com foguete e planetas.",
  },
  capaTrip2: {
    src: `${dir}/capa-trip-2.jpg`,
    alt: "Capa de Robótica Trip 2, Pack 1: robô laranja e roxo na água, em fundo verde, com submarino amarelo.",
  },
  capaTrip3: {
    src: `${dir}/capa-trip-3.jpg`,
    alt: "Capa de Robótica Trip 3, Pack 1: robô verde em fundo laranja, com avião e bolhas.",
  },

  // Editora: páginas do miolo, que mostram como a série ensina.
  atividadeCartinhas: {
    src: `${dir}/atividade-cartinhas.jpg`,
    alt: "Página com cartinhas de programação — para frente, para trás, vira à direita e vira à esquerda — e setas ligando os pontos A, B, C e D.",
  },
  atividadeTrilha: {
    src: `${dir}/atividade-trilha.jpg`,
    alt: "Página com uma trilha da largada à chegada, para o aluno percorrer com o TurTle-T e recortar.",
  },
  atividadeDescarte: {
    src: `${dir}/atividade-descarte.jpg`,
    alt: "Página sobre descarte correto, com lixeiras de orgânico, metal, plástico, vidro e papel.",
  },
  atividadeCaminhos: {
    src: `${dir}/atividade-caminhos.jpg`,
    alt: "Página com dois percursos em grade de blocos para o TurTle-T atravessar seguindo setas.",
  },
  atividadeSensores: {
    src: `${dir}/atividade-sensores.jpg`,
    alt: "Página explicando o sensor ultrassônico, o sensor infravermelho e o Arduino Nano, cada um com foto do componente.",
  },
  atividadeBlocos: {
    src: `${dir}/atividade-blocos.jpg`,
    alt: "Página ensinando a enviar um programa de teste pelo aplicativo do TurTle-T, com blocos de repetição e movimento.",
  },
} as const;

export type PhotoKey = keyof typeof photos;
