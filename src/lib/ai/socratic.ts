// Socratic/Dialectical AI Logic (Pseudo-AI for Demo)

export interface SocraticResponse {
  content: string;
  citations?: { id: string; title: string; page: number }[];
}

export function getSocraticDialectic(topic: string, level: string = 'intermediate'): SocraticResponse {
  const t = topic.toLowerCase();
  
  const keywords = [
    { keys: ['platão', 'caverna', 'idéias'], resp: "Interessante você trazer a alegoria de Platão. Se o mundo sensível é apenas uma sombra, o que nos garante que a linguagem que usamos agora não é também uma sombra de uma verdade maior?" },
    { keys: ['aristóteles', 'ética', 'virtude', 'meio-termo'], resp: "Aristóteles fala da virtude como o justo meio. Mas me diga, em um mundo de extremos, como podemos discernir o centro sem antes conhecermos os abismos?" },
    { keys: ['justiça', 'direito', 'lei'], resp: "A justiça é um ideal eterno ou uma convenção humana? Se a lei de hoje contradiz a moral de amanhã, qual delas é justa?" },
    { keys: ['metafísica', 'ser', 'existência'], resp: "O ser é uno ou múltiplo? Se tudo flui, como dizia Heráclito, o que é que permanece para que possamos chamar de 'Eu'?" },
    { keys: ['política', 'estado', 'poder'], resp: "O poder corrompe ou apenas revela a verdadeira face do homem? Pode um Estado ser justo se os indivíduos que o compõem não o são?" },
    { keys: ['felicidade', 'eudaimonia'], resp: "A felicidade é um destino ou um subproduto da atividade virtuosa? Podemos ser felizes sozinhos, ou a felicidade exige o Outro?" },
    { keys: ['tecnologia', 'digital', 'ia', 'inteligência'], resp: "Se a inteligência é a capacidade de discernir a verdade, pode uma máquina, que processa apenas dados, chegar à sabedoria (Phronesis)? Ou a sabedoria exige o sofrimento e a experiência humana?" }
  ];

  const match = keywords.find(k => k.keys.some(key => t.includes(key)));

  if (match) {
    return { content: match.resp };
  }

  return {
    content: `Sua reflexão sobre "${topic.substring(0, 30)}..." abre caminhos interessantes. Mas considere: se definirmos o tema apenas por seus efeitos, estaremos negligenciando sua essência? O que você entende por este conceito em sua raiz mais profunda?`
  };
}

export function getDebateAntithesis(lastArgument: string): SocraticResponse {
  const t = lastArgument.toLowerCase();
  
  if (t.includes('sempre') || t.includes('nunca') || t.includes('todos')) {
    return { content: "Você usa termos absolutos. Mas a realidade não é composta de nuances? Um único contra-exemplo não derrubaria toda a sua tese?" };
  }
  
  if (t.includes('eu acho') || t.includes('acredito')) {
    return { content: "Sua crença é baseada na Doxa (opinião) ou no Episteme (conhecimento)? Como podemos elevar esse sentimento a uma verdade universal?" };
  }

  return {
    content: `Entendo seu ponto de vista. No entanto, se invertermos a premissa de que "${lastArgument.substring(0, 40)}...", não encontraríamos uma contradição necessária? O que aconteceria se todos agissem segundo essa lógica?`
  };
}
