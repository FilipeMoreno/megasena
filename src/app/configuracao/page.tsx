"use client";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useEffect, useState } from "react";

const diasSemana = [
	"segunda",
	"terça",
	"quarta",
	"quinta",
	"sexta",
	"sábado",
	"domingo",
];

export default function Configuracao() {
	const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
	const [horario, setHorario] = useState("");
	const [message, setMessage] = useState("");

	useEffect(() => {
		const loadConfig = async () => {
			const { data, error } = await supabase
				.from("megasena_config")
				.select("*")
				.single();

			if (data && data.data_sorteio) {
				const config = JSON.parse(data.data_sorteio);
				setDiasSelecionados(config.dias || []);
				setHorario(config.horario || "");
			}
		};
		loadConfig();
	}, []);

	const toggleDia = (dia: string) => {
		setDiasSelecionados((prev) =>
			prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia],
		);
	};

	const handleSalvar = async () => {
		const dataSorteio = JSON.stringify({
			dias: diasSelecionados,
			horario,
		});

		const { error } = await supabase
			.from("megasena_config")
			.update({ data_sorteio: dataSorteio })
			.eq("id", 1);

		if (error) {
			setMessage("Erro ao salvar configuração");
			console.log(error);
			return;
		}

		setMessage("Configuração salva com sucesso!");
	};

	return (
		<main className="p-4">
			<h1 className="text-xl font-bold mb-4">Configuração do Sorteio</h1>

			<div className="mb-4">
				<p className="mb-2 font-medium">Dias do Sorteio:</p>
				<div className="flex gap-2 flex-wrap">
					{diasSemana.map((dia) => (
						<label key={dia} className="flex items-center gap-1">
							<input
								type="checkbox"
								checked={diasSelecionados.includes(dia)}
								onChange={() => toggleDia(dia)}
							/>
							{dia}
						</label>
					))}
				</div>
			</div>

			<div className="mb-4">
				<label className="font-medium block mb-1">Horário do Sorteio:</label>
				<input
					type="time"
					value={horario}
					onChange={(e) => setHorario(e.target.value)}
					className="border p-2 rounded"
				/>
			</div>

			<Button onClick={handleSalvar}>Salvar Configuração</Button>

			{message && <p className="mt-2">{message}</p>}
		</main>
	);
}
