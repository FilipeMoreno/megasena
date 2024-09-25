"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ArrowLeft, XIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Resultado = {
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

export default function Sorteio() {
	const route = useRouter();
	const searchParams = usePathname();
	const sorteio = searchParams.split("/")[1];
	const [resultado, setResultado] = useState<Resultado | null>(null);
	const [apostas, setApostas] = useState<{ numeros: string[]; nome: string }[]>(
		[{ numeros: ["", "", "", "", "", ""], nome: "" }],
	);
	const [mensagens, setMensagens] = useState<string[]>([]);
	const [useCustomNames, setUseCustomNames] = useState(false);
	const { setTheme, theme } = useTheme();

	useEffect(() => {
		const fetchResultado = async () => {
			if (!sorteio) return;

			const cachedResultado = localStorage.getItem(`resultado-${sorteio}`);
			if (cachedResultado) {
				const parsedResultado = JSON.parse(cachedResultado);
				if (parsedResultado.numero === Number.parseInt(sorteio, 10)) {
					setResultado(parsedResultado);
					return;
				}
			}

			const response = await fetch(
				`https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/${sorteio}`,
			);
			const data: Resultado = await response.json();
			setResultado(data);
			localStorage.setItem(`resultado-${sorteio}`, JSON.stringify(data));
		};

		fetchResultado();
	}, [sorteio]);

	const handleInputChange = (
		apostaIndex: number,
		numIndex: number,
		value: string,
	) => {
		const newApostas = [...apostas];
		newApostas[apostaIndex].numeros[numIndex] = value;

		if (value.length === 2) {
			if (numIndex < 5) {
				const nextInput = document.getElementById(
					`numInput-${apostaIndex}-${numIndex + 1}`,
				);
				if (nextInput) {
					nextInput.focus();
				}
			}
			handleCheck();
		}

		setApostas(newApostas);
	};

	const handleNameChange = (apostaIndex: number, value: string) => {
		const newApostas = [...apostas];
		newApostas[apostaIndex].nome = value;
		setApostas(newApostas);
	};

	const addAposta = () => {
		setApostas([...apostas, { numeros: ["", "", "", "", "", ""], nome: "" }]);
	};

	const removeAposta = (apostaIndex: number) => {
		if (apostas.length <= 1) {
			setApostas([{ numeros: ["", "", "", "", "", ""], nome: "" }]);
			setMensagens([]);
			return;
		}

		const newApostas = [...apostas];
		newApostas.splice(apostaIndex, 1);

		const newMensagens = [...mensagens];
		newMensagens.splice(apostaIndex, 1);

		setApostas(newApostas);
		setMensagens(newMensagens);
	};

	const removerTodasApostas = () => {
		setApostas([{ numeros: ["", "", "", "", "", ""], nome: "" }]);
		setMensagens([]);
	};

	const handleCheck = () => {
		if (!resultado) return;

		const newMensagens = apostas.map((aposta) => {
			const numerosAposta = Array.isArray(aposta.numeros)
				? aposta.numeros
				: [aposta.numeros];

			const acertos = numerosAposta.filter((num) =>
				resultado.listaDezenas.includes(num),
			).length;

			switch (acertos) {
				case 6: {
					const premio6 = resultado.listaRateioPremio.find(
						(faixa) => faixa.faixa === 1,
					);
					return `Parabéns! Você e mais ${premio6?.numeroDeGanhadores.toLocaleString("pt-BR")} pessoas acertaram todos os números! Valor do prêmio: ${premio6?.valorPremio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
				}
				case 5: {
					const premio5 = resultado.listaRateioPremio.find(
						(faixa) => faixa.faixa === 2,
					);
					return `Você e mais ${premio5?.numeroDeGanhadores.toLocaleString("pt-BR")} pessoas acertaram 5 números! Valor do prêmio: ${premio5?.valorPremio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
				}
				case 4: {
					const premio4 = resultado.listaRateioPremio.find(
						(faixa) => faixa.faixa === 3,
					);
					return `Você e mais ${premio4?.numeroDeGanhadores.toLocaleString("pt-BR")} pessoas acertaram 4 números! Valor do prêmio: ${premio4?.valorPremio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`;
				}
				case 0:
					return "Você não acertou nenhum número.";
				default:
					return `Você acertou ${acertos} números.`;
			}
		});

		setMensagens(newMensagens);
	};

	if (!resultado)
		return (
			<div className="flex flex-col gap-1 items-center justify-center w-screen h-screen">
				<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
				<p className="animate-dots">Carregando...</p>
			</div>
		);

	return (
		<main className="bg-gray-50 p-4">
			<div className="hidden w-full mb-4 lg:flex justify-between">
				<Button
					variant={"ghost"}
					size={"icon"}
					onClick={() => route.back()}
					className="mb-2 text-megasena"
				>
					<ArrowLeft />
				</Button>
			</div>
			<div className="flex lg:flex-row flex-col justify-center min-h-screen gap-4">
				<Card className="w-full max-w-lg max-h-[650px] p-4">
					<CardHeader>
						<CardTitle className="text-center text-2xl font-bold text-megasena">
							Resultado do Sorteio #{sorteio}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-center mb-4">
							{(resultado.acumulado && (
								<Alert variant={"megasena"} className="mb-4 w-full">
									<AlertTitle className="font-bold">Acumulou!</AlertTitle>
									<AlertDescription>
										O sorteio #{sorteio} acumulou! O prêmio estimado para o
										próximo sorteio é de {""}
										<b>
											{resultado.valorEstimadoProximoConcurso.toLocaleString(
												"pt-BR",
												{
													style: "currency",
													currency: "BRL",
												},
											)}
										</b>
										.
									</AlertDescription>
								</Alert>
							)) || (
								<Alert className="p-4" variant={"info"}>
									<AlertTitle className="font-bold">
										<b>{resultado.listaRateioPremio[0].numeroDeGanhadores}</b>{" "}
										{resultado.listaRateioPremio[0].numeroDeGanhadores > 1
											? "GANHADORES!"
											: "GANHADOR!"}
									</AlertTitle>
									<AlertDescription>
										Valor do prêmio:{" "}
										<b>
											{resultado.listaRateioPremio[0].valorPremio.toLocaleString(
												"pt-BR",
												{
													style: "currency",
													currency: "BRL",
												},
											)}
										</b>
										.
									</AlertDescription>
								</Alert>
							)}
						</div>
						<div className="text-center mb-4">
							<p className="text-md mb-2">Dezenas Sorteadas:</p>
							<div className="flex justify-center space-x-2">
								{resultado.listaDezenas.map((dezena, index) => (
									<span
										key={index}
										className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold"
									>
										{dezena}
									</span>
								))}
							</div>
						</div>
						<div className="flex flex-col items-center justify-center gap-2">
							<p className="text-md">Prêmio estimado para o próximo sorteio:</p>
							<p className="text-lg p-2 font-bold rounded-lg bg-megasena text-megasena-foreground">
								{resultado.valorEstimadoProximoConcurso.toLocaleString(
									"pt-BR",
									{
										style: "currency",
										currency: "BRL",
									},
								)}
							</p>
						</div>
						<div className="flex flex-col items-center justify-center gap-4 mt-4 p-4 rounded-lg bg-megasena/10">
							{resultado.listaRateioPremio.map((premio, index) => {
								if (premio.numeroDeGanhadores === 0) return null;
								return (
									<div key={index} className="text-center">
										<p className="text-md font-semibold">
											{premio.descricaoFaixa}:{" "}
											{premio.numeroDeGanhadores.toLocaleString("pt-BR")}{" "}
											ganhadores
										</p>
										<p className="text-md">
											Valor do prêmio:{" "}
											{premio.valorPremio.toLocaleString("pt-BR", {
												style: "currency",
												currency: "BRL",
											})}
										</p>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
				<div className="w-full max-w-lg">
					<Card className="w-full p-4 mb-4">
						<div className="flex items-center justify-between p-4">
							<div className="flex flex-col justify-between mb-4">
								<label htmlFor="customNames" className="text-sm mb-2">
									Inserir nome nas apostas
								</label>
								<Switch
									id="customNames"
									checked={useCustomNames}
									onCheckedChange={setUseCustomNames}
								/>
							</div>
							<div>
								<Button onClick={removerTodasApostas}>Limpar tudo</Button>
							</div>
						</div>
						{apostas.map((aposta, apostaIndex) => (
							<Card key={apostaIndex} className="w-full mb-4">
								<CardHeader>
									<CardTitle className="text-center text-xl font-semibold">
										<div className="flex justify-between items-center">
											{useCustomNames && aposta.nome
												? aposta.nome
												: `Aposta #${apostaIndex + 1}`}
											<Button
												onClick={() => removeAposta(apostaIndex)}
												variant={"ghost"}
												size={"icon"}
												className="text-destructive hover:text-destructive/80"
											>
												<XIcon />
											</Button>
										</div>
									</CardTitle>
								</CardHeader>
								<CardContent>
									{useCustomNames && (
										<Input
											type="text"
											placeholder="Nome da Aposta"
											value={aposta.nome}
											onChange={(e) =>
												handleNameChange(apostaIndex, e.target.value)
											}
											className="mb-4"
										/>
									)}
									<div className="flex flex-row space-x-2">
										{aposta.numeros.map((num, numIndex) => (
											<Input
												key={numIndex}
												id={`numInput-${apostaIndex}-${numIndex}`}
												type="text"
												value={num}
												maxLength={2}
												placeholder={`Nº ${numIndex + 1}`}
												onChange={(e) =>
													handleInputChange(
														apostaIndex,
														numIndex,
														e.target.value,
													)
												}
												className={cn({
													"border-green-500":
														mensagens[apostaIndex] &&
														num !== "" &&
														resultado.listaDezenas.includes(num),
													"border-red-500":
														mensagens[apostaIndex] &&
														num !== "" &&
														!resultado.listaDezenas.includes(num),
												})}
											/>
										))}
									</div>
									{mensagens[apostaIndex] && (
										<p className="mt-2 text-center">{mensagens[apostaIndex]}</p>
									)}
								</CardContent>
							</Card>
						))}
						<Button onClick={addAposta} className="w-full mb-2">
							Adicionar Aposta
						</Button>
					</Card>
				</div>
			</div>
		</main>
	);
}
