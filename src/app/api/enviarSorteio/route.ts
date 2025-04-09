import { EmailTemplate } from "@/components/EmailTemplate";
import { supabase } from "@/lib/supabaseClient";
import { render } from "@react-email/render";
import { NextResponse } from "next/server";
import React from "react";
import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_SENDER = "Resultado da Mega <megasena@filipemoreno.com.br>";

const resend = new Resend(RESEND_API_KEY);

export async function GET() {
	try {
		// Busca o resultado do sorteio
		const responseSorteio = await fetch(
			"https://loteriascaixa-api.herokuapp.com/api/megasena/latest",
		);
		if (!responseSorteio.ok) {
			return NextResponse.json(
				{ error: "Erro ao buscar resultado do sorteio" },
				{ status: 500 },
			);
		}
		const sorteio = await responseSorteio.json();
		// Garante que as dezenas são strings sem espaços extras
		const dezenas: string[] = Array.isArray(sorteio.dezenas)
			? sorteio.dezenas.map((d: any) => String(d).trim())
			: [];
		const concurso = sorteio.concurso;

		// Busca todos os registros com notificar_email preenchido
		const { data: apostasList, error: apostasError } = await supabase
			.from("megasena_apostas")
			.select("id, notificar_email, apostas")
			.neq("notificar_email", null);

		if (apostasError || !apostasList || apostasList.length === 0) {
			return NextResponse.json(
				{ message: "Nenhum e-mail para notificar" },
				{ status: 200 },
			);
		}

		// Para cada usuário, processa o envio do e-mail
		for (const apostaRegistro of apostasList) {
			const emailDestino = apostaRegistro.notificar_email;

			// Verifica se já foi enviado um e-mail para esse usuário e concurso
			const { data: emailEnviado, error: emailVerifError } = await supabase
				.from("megasena_email_enviado")
				.select("id")
				.match({ email: emailDestino, concurso: concurso });

			if (emailVerifError) {
				console.error(
					"Erro ao verificar registro de e-mail enviado para",
					emailDestino,
					emailVerifError,
				);
				continue;
			}
			if (emailEnviado && emailEnviado.length > 0) {
				console.log(
					`Email já enviado para ${emailDestino} no concurso ${concurso}.`,
				);
				continue; // não envia duplicado
			}

			// Garante que as apostas estão em formato de array
			let apostasUsuario: any[] = [];
			if (typeof apostaRegistro.apostas === "string") {
				try {
					apostasUsuario = JSON.parse(apostaRegistro.apostas);
				} catch {
					apostasUsuario = [];
				}
			} else if (Array.isArray(apostaRegistro.apostas)) {
				apostasUsuario = apostaRegistro.apostas;
			}

			// Verifica se o usuário tem alguma aposta vencedora
			let isWinner = false;

			const numerosSorteadosSet = new Set(dezenas.map(String));

			for (const apostaItem of apostasUsuario) {
				if (
					!apostaItem ||
					!Array.isArray(apostaItem.numeros) ||
					apostaItem.numeros.length === 0
				) {
					continue;
				}

				const acertos = apostaItem.numeros.filter((n: any) =>
					numerosSorteadosSet.has(String(n).trim()),
				);

				console.log("Aposta:", apostaItem.numeros, "Acertos:", acertos.length);

				if (acertos.length === 6) {
					isWinner = true;
					break;
				}

				if (isWinner) {
					return NextResponse.json({
						message: "Aposta vencedora encontrada",
					});
				}
			}

			const subject = isWinner
				? `Parabéns! Você é o mais novo milionário - Mega-Sena #${concurso}`
				: `Resultado Mega-Sena #${concurso} - ${sorteio.data}`;

			// Renderiza o template do e-mail, passando o flag "isWinner" para customização
			const element = React.createElement(EmailTemplate, {
				concurso: concurso,
				dataApuracao: sorteio.data,
				dezenasSorteadas: dezenas,
				apostas: apostasUsuario,
				acumulado: sorteio.acumulou,
				valorPremio: sorteio.valorEstimadoProximoConcurso,
				listaRateioPremio: sorteio.premiacoes,
				isWinner,
			});

			const { error: emailError } = await resend.emails.send({
				from: RESEND_SENDER,
				to: emailDestino,
				subject: subject,
				html: await render(element),
			});

			if (emailError) {
				console.error(
					"Erro ao enviar e-mail para",
					emailDestino,
					"->",
					emailError,
				);
				continue;
			}

			// Após envio com sucesso, registra na tabela para evitar duplicidade
			const { error: insertError } = await supabase
				.from("megasena_email_enviado")
				.insert([
					{ email: emailDestino, concurso: concurso, data_envio: new Date() },
				]);

			if (insertError) {
				console.error(
					"Erro ao inserir registro de envio para",
					emailDestino,
					"->",
					insertError,
				);
			}
		}

		return NextResponse.json({
			message: "Processo de envio de e-mails concluído",
		});
	} catch (error) {
		console.error("Erro interno:", error);
		return NextResponse.json(
			{ error: "Erro interno no servidor" },
			{ status: 500 },
		);
	}
}
