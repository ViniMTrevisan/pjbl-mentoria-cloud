import type { AtualizarMentorInput, Mentor } from './mentor';
import { gerarId } from '../../../shared/domain/texto';
import { validarMentor, type MentorValidado, type ResultadoValidacao } from './validation';

function comIds(validado: MentorValidado) {
  return {
    areas: validado.areas.map((area) => ({
      id: area.id ?? gerarId('a'),
      curso: area.curso,
      materia: area.materia,
    })),
    disponibilidades: validado.disponibilidades.map((disponibilidade) => ({
      id: disponibilidade.id ?? gerarId('d'),
      diaSemana: disponibilidade.diaSemana,
      horaInicio: disponibilidade.horaInicio,
      horaFim: disponibilidade.horaFim,
    })),
  };
}

/** Cria o documento de mentor a partir de dados ja validados. */
export function novoMentor(validado: MentorValidado, agora: string): Mentor {
  const { areas, disponibilidades } = comIds(validado);
  return {
    id: gerarId('m'),
    nome: validado.nome,
    email: validado.email,
    curso: validado.curso,
    ...(validado.periodo !== undefined ? { periodo: validado.periodo } : {}),
    bio: validado.bio,
    ehMentor: validado.ehMentor,
    ehMentorado: validado.ehMentorado,
    areas,
    disponibilidades,
    avaliacoes: [],
    criadoEm: agora,
    atualizadoEm: agora,
  };
}

/** Aplica um patch parcial sobre o mentor existente, revalidando o resultado. */
export function aplicarAlteracoes(
  atual: Mentor,
  patch: AtualizarMentorInput,
  agora: string,
): ResultadoValidacao<Mentor> {
  const base = {
    nome: patch.nome !== undefined ? patch.nome : atual.nome,
    email: patch.email !== undefined ? patch.email : atual.email,
    curso: patch.curso !== undefined ? patch.curso : atual.curso,
    periodo: patch.periodo !== undefined ? patch.periodo : atual.periodo,
    bio: patch.bio !== undefined ? patch.bio : atual.bio,
    ehMentor: patch.ehMentor !== undefined ? patch.ehMentor : atual.ehMentor,
    ehMentorado: patch.ehMentorado !== undefined ? patch.ehMentorado : atual.ehMentorado,
    areas: patch.areas !== undefined ? patch.areas : atual.areas,
    disponibilidades:
      patch.disponibilidades !== undefined ? patch.disponibilidades : atual.disponibilidades,
  };

  const resultado = validarMentor(base);
  if (!resultado.ok) return resultado;

  const { areas, disponibilidades } = comIds(resultado.valor);
  const atualizado: Mentor = {
    ...atual,
    nome: resultado.valor.nome,
    email: resultado.valor.email,
    curso: resultado.valor.curso,
    bio: resultado.valor.bio,
    ehMentor: resultado.valor.ehMentor,
    ehMentorado: resultado.valor.ehMentorado,
    areas,
    disponibilidades,
    atualizadoEm: agora,
  };

  if (resultado.valor.periodo !== undefined) {
    atualizado.periodo = resultado.valor.periodo;
  } else {
    delete atualizado.periodo;
  }

  return { ok: true, valor: atualizado };
}

const CAMPOS_COMPARADOS = [
  'nome',
  'email',
  'curso',
  'periodo',
  'bio',
  'ehMentor',
  'ehMentorado',
  'areas',
  'disponibilidades',
] as const;

/** Lista os campos que mudaram entre dois estados do mentor. */
export function camposAlterados(antes: Mentor, depois: Mentor): string[] {
  return CAMPOS_COMPARADOS.filter((campo) => {
    const valorAntes = antes[campo];
    const valorDepois = depois[campo];
    if (Array.isArray(valorAntes) && Array.isArray(valorDepois)) {
      return JSON.stringify(valorAntes) !== JSON.stringify(valorDepois);
    }
    return valorAntes !== valorDepois;
  });
}
