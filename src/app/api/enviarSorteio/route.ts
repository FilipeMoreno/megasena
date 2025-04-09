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
		const responseSorteio = await fetch(
			"https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena",
		);
		if (!responseSorteio.ok) {
			return NextResponse.json(
				{ error: "Erro ao buscar resultado do sorteio" },
				{ status: 500 },
			);
		}
		const sorteio = await responseSorteio.json();

		const dezenas: string[] = Array.isArray(sorteio.listaDezenas)
			? sorteio.listaDezenas
			: [];

		const { data: aposta, error: apostaError } = await supabase
			.from("megasena_apostas")
			.select("notificar_email, apostas")
			.neq("notificar_email", null)
			.order("created_at", { ascending: false })
			.limit(1)
			.single();

		if (apostaError || !aposta?.notificar_email) {
			return NextResponse.json(
				{ message: "Nenhum e-mail para notificar" },
				{ status: 200 },
			);
		}
		const emailDestino = aposta.notificar_email;

		const apostas = Array.isArray(aposta.apostas) ? aposta.apostas : [];

		const element = React.createElement(EmailTemplate, {
			concurso: sorteio.numero,
			dataApuracao: sorteio.dataApuracao,
			dezenasSorteadas: dezenas,
			apostas,
			acumulado: sorteio.acumulado,
			valorPremio: sorteio.valorEstimadoProximoConcurso,
			listaRateioPremio: sorteio.listaRateioPremio,
		});

		const emailHtml = render(element);

		const { error: emailError } = await resend.emails.send({
			from: RESEND_SENDER,
			to: emailDestino,
			subject: `Resultado ${sorteio.dataApuracao} - Mega Sena #${sorteio.numero}`,
			html: (await emailHtml).toString(),
		});

		if (emailError) {
			return NextResponse.json(
				{ error: "Erro ao enviar e-mail", message: emailError.message },
				{ status: 500 },
			);
		}

		return NextResponse.json({ message: "E-mail enviado com sucesso" });
	} catch (error) {
		console.error(error);
		return NextResponse.json(
			{ error: "Erro interno no servidor" },
			{ status: 500 },
		);
	}
}
