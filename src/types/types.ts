export type Resultado = {
	acumulado: boolean;
	listaDezenas: string[];
	valorEstimadoProximoConcurso: number;
	listaRateioPremio: {
		descricaoFaixa: string;
		faixa: number;
		numeroDeGanhadores: number;
		valorPremio: number;
	}[];
	numero: number;
	dataApuracao: string;
	dataProximoConcurso: string;
};
