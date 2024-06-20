"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";

type Resultado = {
	[x: string]: any;
	numero: number;
	dataApuracao: string;
	listaDezenas: string[];
	valorEstimadoProximoConcurso: number;
	acumulado: boolean;
	dataProximoConcurso: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
	const [numeroSorteio, setNumeroSorteio] = useState<number | null>(null);
	const [resultadoAtual, setResultadoAtual] = useState<Resultado | null>(null);
	const [sorteio, setSorteio] = useState<string>("");
	const route = useRouter();

	const {
		data: ultimoResultado,
		error,
		mutate,
	} = useSWR<Resultado, any>(
		"https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena",
		fetcher,
		{
			revalidateOnFocus: false,
			onSuccess: (data) => {
				localStorage.setItem("ultimoResultado", JSON.stringify(data));
			},
		},
	);

	const loading = !ultimoResultado && !error;

	useEffect(() => {
		const cachedData = localStorage.getItem("ultimoResultado");
		if (cachedData) {
			const parsedData: Resultado = JSON.parse(cachedData);
			setNumeroSorteio(parsedData.numero);
			setResultadoAtual(parsedData);
			const partesData = parsedData.dataProximoConcurso.split("/");
			const dataProximoConcurso = new Date(
				Number.parseInt(partesData[2]),
				Number.parseInt(partesData[1]) - 1,
				Number.parseInt(partesData[0]),
			);
			const agora = new Date();

			if (dataProximoConcurso < agora) {
				mutate();
			}
		}
	}, [mutate]);

	const fetchSorteio = async (numero: number) => {
		const cachedSorteio = localStorage.getItem(`sorteio_${numero}`);
		if (cachedSorteio) {
			setResultadoAtual(JSON.parse(cachedSorteio));
		} else {
			const response = await fetch(
				`https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/${numero}`,
			);
			const data: Resultado = await response.json();
			localStorage.setItem(`sorteio_${numero}`, JSON.stringify(data));
			setResultadoAtual(data);
		}
	};

	const handlePrevSorteio = () => {
		if (numeroSorteio && numeroSorteio > 1) {
			const novoNumero = numeroSorteio - 1;
			setNumeroSorteio(novoNumero);
			fetchSorteio(novoNumero);
		}
	};

	const handleNextSorteio = () => {
		if (
			numeroSorteio &&
			ultimoResultado &&
			numeroSorteio < ultimoResultado.numero
		) {
			const novoNumero = numeroSorteio + 1;
			setNumeroSorteio(novoNumero);
			fetchSorteio(novoNumero);
		}
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (sorteio) {
			const numero = Number.parseInt(sorteio, 10);
			setNumeroSorteio(numero);
			fetchSorteio(numero);
			return route.push(`/${numero}`);
		}
	};

	if (loading)
		return (
			<div className="flex flex-col gap-1 items-center justify-center w-screen h-screen">
				<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
				<p className="animate-dots">carregando...</p>
			</div>
		);
	if (error)
		return (
			<div className="flex flex-col gap-1 items-center justify-center w-screen h-screen">
				<p>falha ao carregar...</p>
			</div>
		);

	return (
		<main className="bg-gray-50 p-4 min-h-screen flex flex-row items-center justify-center">
			<div className="flex flex-col lg:flex-row items-center justify-center bg-gray-50 lg:p-0 gap-4 p-4">
				<Card className="w-full max-w-md h-auto p-2">
					<CardHeader>
						<CardTitle className="text-center text-2xl font-bold items-center flex justify-center">
							<div className="bg-megasena p-2 rounded-lg w-full flex items-center justify-center">
								<Image
									src={"/mega-sena-logo.webp"}
									width={300}
									height={300}
									alt="Logo Mega-Sena"
									quality={100}
								/>
							</div>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form
							onSubmit={handleSubmit}
							className="flex flex-col items-center space-y-4"
						>
							<Input
								type="text"
								placeholder="Número do Sorteio"
								value={sorteio}
								onChange={(e) => setSorteio(e.target.value)}
								className="w-full"
								required
							/>
							<Button variant={"megasena"} type="submit" className="w-full">
								Verificar Resultado
							</Button>
						</form>
					</CardContent>
				</Card>
				{resultadoAtual && (
					<Card className="w-full max-w-md p-4 h-auto relative">
						<CardHeader>
							<CardTitle className="text-center text-xl text-megasena font-bold">
								Concurso #{resultadoAtual.numero}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-center">Data: {resultadoAtual.dataApuracao}</p>
							<div className="mt-4 text-center">
								<p>Dezenas Sorteadas:</p>
								<div className="flex justify-center space-x-2 mt-3">
									{resultadoAtual.listaDezenas.map((dezena, index) => (
										<span
											key={index}
											className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold"
										>
											{dezena}
										</span>
									))}
								</div>
								{(resultadoAtual.acumulado && (
									<Alert className="mt-4" variant={"megasena"}>
										<AlertTitle className="font-bold">Acumulou!</AlertTitle>
										<AlertDescription>
											O prêmio estimado para o próximo sorteio é de{" "}
											<b>
												{resultadoAtual.valorEstimadoProximoConcurso.toLocaleString(
													"pt-BR",
													{ style: "currency", currency: "BRL" },
												)}
											</b>
											.
										</AlertDescription>
									</Alert>
								)) || (
									<Alert className="mt-4" variant={"info"}>
										<AlertTitle className="font-bold">
											<b>
												{resultadoAtual.listaRateioPremio[0].numeroDeGanhadores}
											</b>{" "}
											{resultadoAtual.listaRateioPremio[0].numeroDeGanhadores >
											1
												? "GANHADORES!"
												: "GANHADOR!"}
										</AlertTitle>
										<AlertDescription>
											<p>
												Valor do prêmio: {""}
												<b>
													{resultadoAtual.listaRateioPremio[0].valorPremio.toLocaleString(
														"pt-BR",
														{ style: "currency", currency: "BRL" },
													)}
												</b>
												.
											</p>
										</AlertDescription>
									</Alert>
								)}
								<Button
									variant={"megasena"}
									type="submit"
									className="w-full my-4"
									onClick={() => route.push(`/${resultadoAtual.numero}`)}
								>
									Verificar Resultado de #{resultadoAtual.numero}
								</Button>
							</div>
						</CardContent>
						{numeroSorteio && numeroSorteio > 1 && (
							<div className="absolute top-1/2 left-0 transform -translate-y-1/2">
								<Button
									variant={"ghost"}
									size={"icon"}
									onClick={handlePrevSorteio}
								>
									<ArrowLeft className="text-megasena" />
								</Button>
							</div>
						)}
						{numeroSorteio &&
							ultimoResultado &&
							numeroSorteio < ultimoResultado.numero && (
								<div className="absolute top-1/2 right-0 transform -translate-y-1/2">
									<Button
										variant={"ghost"}
										size={"icon"}
										onClick={handleNextSorteio}
									>
										<ArrowRight className="text-megasena" />
									</Button>
								</div>
							)}
					</Card>
				)}
			</div>
		</main>
	);
}
