/**
 * ATENÇÃO — ESTAS FOTOS NÃO SÃO DA TkxHi.
 *
 * São imagens de banco (Unsplash, licença de uso comercial livre) usadas como
 * preenchimento visual até existirem fotos do trabalho real da empresa. Não
 * mostram equipamentos, peças nem publicações da TkxHi, e num site
 * institucional isso é uma fragilidade: o visitante que reconhecer a foto
 * genérica desconfia do resto.
 *
 * Para substituir: coloque o arquivo em public/images/ e troque `src` pelo
 * caminho local. O restante — enquadramento, legenda, responsividade — não muda.
 */
const base = "https://images.unsplash.com";
const params = "?auto=format&fit=crop&w=1400&q=70";

export const stockPhotos = {
  engenhariaBancada: {
    src: `${base}/photo-1640955785023-1854685dae05${params}`,
    alt: "Pinça posicionando um microchip sobre uma placa de circuito verde.",
  },
  engenhariaTeste: {
    src: `${base}/photo-1517420704952-d9f39e95b43e${params}`,
    alt: "Placas de circuito sobre bancada, ao lado de um instrumento de teste.",
  },
  impressaoMaquinas: {
    src: `${base}/photo-1611117775350-ac3950990985${params}`,
    alt: "Fileira de impressoras 3D produzindo peças cilíndricas sobre bancada de madeira.",
  },
  impressaoDetalhe: {
    src: `${base}/photo-1611505982706-9ebc79e5d3f1${params}`,
    alt: "Detalhe do mecanismo de uma máquina industrial em preto e prata.",
  },
  editoraPaginas: {
    src: `${base}/photo-1530951517437-1b43a7349b10${params}`,
    alt: "Close das páginas de um livro aberto.",
  },
  editoraPagina: {
    src: `${base}/photo-1585896452649-6ede5e126800${params}`,
    alt: "Página impressa em branco sobre superfície escura.",
  },
} as const;
