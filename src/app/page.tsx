"use client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";

type Resultado = {
	numero: number;
	dataApuracao: string;
	listaDezenas: string[];
	valorEstimadoProximoConcurso: number;
	acumulado: boolean;
	dataProximoConcurso: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Home() {
	const [sorteio, setSorteio] = useState<string>("");
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
	const router = useRouter();

	useEffect(() => {
		const cachedData = localStorage.getItem("ultimoResultado");
		if (cachedData) {
			const parsedData: Resultado = JSON.parse(cachedData);
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
	}, []);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (sorteio) {
			router.push(`/${sorteio}`);
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
		<main className="bg-gray-50 p-4 min-h-screen">
			<div className="hidden w-full mb-4 lg:flex justify-between">
				<Button
					variant={"ghost"}
					size={"icon"}
					onClick={() => router.back()}
					className="mb-2"
				>
					<ArrowLeft />
				</Button>
			</div>
			<div className="flex flex-col lg:flex-row items-center justify-center bg-gray-50 lg:p-0 p-2 gap-4">
				<Card className="w-full max-w-md h-[350px] p-2">
					<CardHeader>
						<CardTitle className="text-center text-2xl font-bold items-center flex justify-center mt-8">
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
				{ultimoResultado && (
					<Card className="w-full max-w-md p-4 h-[350px]">
						<CardHeader>
							<CardTitle className="text-center text-xl text-megasena font-bold">
								Último Concurso #{ultimoResultado.numero}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-center">
								Data: {ultimoResultado.dataApuracao}
							</p>
							<div className="mt-4 text-center">
								<p>Dezenas Sorteadas:</p>
								<div className="flex justify-center space-x-2 mt-3">
									{ultimoResultado.listaDezenas.map((dezena, index) => (
										<span
											key={index}
											className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold"
										>
											{dezena}
										</span>
									))}
								</div>
								{ultimoResultado.acumulado && (
									<Alert className="mt-4" variant={"megasena"}>
										<AlertTitle className="font-bold">Acumulou!</AlertTitle>
										<AlertDescription>
											O prêmio estimado para o próximo sorteio é de{" "}
											<b>
												{ultimoResultado.valorEstimadoProximoConcurso.toLocaleString(
													"pt-BR",
													{ style: "currency", currency: "BRL" },
												)}
											</b>
											.
										</AlertDescription>
									</Alert>
								)}
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</main>
	);
}
