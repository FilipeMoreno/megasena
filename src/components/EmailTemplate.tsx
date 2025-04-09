import {
	Body,
	Column,
	Container,
	Head,
	Heading,
	Html,
	Row,
	Section,
	Text,
} from "@react-email/components";
import type * as React from "react";

interface EmailTemplateProps {
	concurso: number;
	dataApuracao: string;
	dezenasSorteadas: string[];
	acumulado: boolean;
	valorPremio: number;
	listaRateioPremio: {
		descricao: string;
		ganhadores: number;
		valorPremio: number;
	}[];
	apostas: {
		nome: string;
		numeros: string[];
	}[];
}

export const EmailTemplate: React.FC<EmailTemplateProps> = ({
	concurso,
	dataApuracao,
	dezenasSorteadas,
	apostas,
	acumulado,
	valorPremio,
	listaRateioPremio,
}) => {
	const isAcerto = (numero: string) => dezenasSorteadas.includes(numero);

	const valorPremioFormatado = Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(valorPremio);

	return (
		<Html>
			<Head />
			<Body
				style={{
					fontFamily: "Arial, sans-serif",
					backgroundColor: "#f6f9fc",
					padding: "20px",
				}}
			>
				<Container
					style={{
						backgroundColor: "#ffffff",
						padding: "20px",
						borderRadius: "5px",
					}}
				>
					<Heading style={{ textAlign: "center", marginBottom: "16px" }}>
						Resultado do Sorteio #{concurso}
					</Heading>

					{/* Card "Acumulou" */}
					{acumulado && (
						<div
							style={{
								backgroundColor: "#d4edda",
								padding: "16px",
								borderRadius: "8px",
								border: "1px solid #c3e6cb",
								color: "#155724",
								marginBottom: "20px",
								textAlign: "center",
							}}
						>
							<strong>Acumulou!</strong> O sorteio #{concurso} acumulou!
							<br />O prêmio estimado para o próximo sorteio é de{" "}
							<strong>{valorPremioFormatado}</strong>.
						</div>
					)}

					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: "20px",
							marginBottom: "20px",
						}}
					>
						{/* Coluna 1: Dezenas */}
						<div>
							<Text
								style={{
									fontSize: "16px",
									fontWeight: "bold",
									marginBottom: "8px",
								}}
							>
								Dezenas Sorteadas:
							</Text>
							<div
								style={{
									display: "flex",
									flexWrap: "wrap",
									gap: "8px",
								}}
							>
								{dezenasSorteadas?.map((dezena, index) => (
									<div
										key={index}
										style={{
											width: "36px",
											height: "36px",
											backgroundColor: "#e9ecef",
											borderRadius: "50%",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											textAlign: "center",
											fontWeight: "bold",
											lineHeight: "36px", // garante texto centralizado em clientes que ignoram flex
										}}
									>
										{dezena}
									</div>
								))}
							</div>
						</div>

						{/* Coluna 2: Informações do sorteio */}
						<div>
							<Text
								style={{
									fontSize: "16px",
									fontWeight: "bold",
									marginBottom: "8px",
								}}
							>
								Informações do Sorteio:
							</Text>
							<div
								style={{
									backgroundColor: "#fafafa",
									borderRadius: "8px",
									border: "1px solid #e9ecef",
									padding: "10px",
								}}
							>
								<Text style={{ margin: 0 }}>
									<b>Data:</b> {dataApuracao}
								</Text>
								<Text style={{ margin: 0 }}>
									<b>Prêmio Próximo Sorteio:</b> {valorPremioFormatado}
								</Text>
								{listaRateioPremio.map((premio, index) => {
									if (premio.ganhadores === 0) return null;
									return (
										<div key={index}>
											<p style={{ fontWeight: "bold", margin: "8px 0 0 0" }}>
												{premio.descricao}:{" "}
												{premio.ganhadores.toLocaleString("pt-BR")} ganhadores
											</p>
											<p style={{ margin: 0 }}>
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
						</div>
					</div>

					{/* Apostas do Usuário */}
					<Section>
						<Text style={{ fontWeight: "bold", marginBottom: "10px" }}>
							Sua(s) Aposta(s):
						</Text>

						{apostas.map((apostaItem, apostaIndex) => {
							const acertos = apostaItem.numeros.filter((n) => isAcerto(n));
							return (
								<div
									key={apostaIndex}
									style={{
										marginBottom: "16px",
										backgroundColor: "#f8f9fa",
										padding: "12px",
										borderRadius: "8px",
										border: "1px solid #e9ecef",
									}}
								>
									<Text style={{ margin: 0, fontWeight: "bold" }}>
										Aposta #{apostaIndex + 1}{" "}
										{apostaItem.nome ? `(${apostaItem.nome})` : ""}
									</Text>
									<Row style={{ marginTop: "8px" }}>
										{apostaItem.numeros.map((numero, numeroIndex) => (
											<Column key={numeroIndex} style={{ padding: "5px" }}>
												<div
													style={{
														width: "36px",
														height: "36px",
														borderRadius: "50%",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														textAlign: "center",
														fontWeight: "bold",
														lineHeight: "36px",
														backgroundColor: isAcerto(numero)
															? "#d4edda"
															: "#e9ecef",
													}}
												>
													{numero}
												</div>
											</Column>
										))}
									</Row>
									<Text style={{ marginTop: "8px" }}>
										Você acertou {acertos.length} número(s).
									</Text>
								</div>
							);
						})}
					</Section>
				</Container>
			</Body>
		</Html>
	);
};
