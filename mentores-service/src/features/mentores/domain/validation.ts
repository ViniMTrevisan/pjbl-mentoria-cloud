import type { Mentor, MentorResumo, FiltroMentores } from './mentor';
import { contemTexto } from '../../../shared/domain/texto';

export type ResultadoValidacao<T> =
  | { ok: true; valor: T }
  | { ok: false; campos: Record<string, string> };

export interface MentorValidado {
  nome: string;
  email: string;
  curso: string;
  periodo?: number;
  bio: string;
  ehMentor: boolean;
  ehMentorado: boolean;
  areas: Array<{ id?: string; curso: string; materia: string }>;
  disponibilidades: Array<{
    id?: string;
    diaSemana: number;
    horaInicio: string;
    horaFim: string;
  }>;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX = {
  nome: 120,
  email: 160,
  curso: 120,
  bio: 600,
  materia: 120,
  comentario: 600,
};

function ehObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function texto(valor: unknown): string | null {
  return typeof valor === 'string' ? valor.trim() : null;
}

function validarAreas(
  bruto: unknown,
  campos: Record<string, string>,
): Array<{ id?: string; curso: string; materia: string }> {
  if (bruto === undefined) return [];
  if (!Array.isArray(bruto)) {
    campos.areas = 'deve ser uma lista';
    return [];
  }
  if (bruto.length > 20) {
    campos.areas = 'maximo de 20 areas';
    return [];
  }
  const areas: Array<{ id?: string; curso: string; materia: string }> = [];
  bruto.forEach((item, indice) => {
    if (!ehObjeto(item)) {
      campos[`areas.${indice}`] = 'area invalida';
      return;
    }
    const curso = texto(item.curso);
    const materia = texto(item.materia);
    if (!curso) campos[`areas.${indice}.curso`] = 'curso obrigatorio';
    if (!materia) campos[`areas.${indice}.materia`] = 'materia obrigatoria';
    if (curso && curso.length > MAX.curso) {
      campos[`areas.${indice}.curso`] = `maximo de ${MAX.curso} caracteres`;
    }
    if (materia && materia.length > MAX.materia) {
      campos[`areas.${indice}.materia`] = `maximo de ${MAX.materia} caracteres`;
    }
    if (!curso || !materia) return;
    const id = texto(item.id);
    areas.push({ ...(id ? { id } : {}), curso, materia });
  });
  return areas;
}

function validarDisponibilidades(
  bruto: unknown,
  campos: Record<string, string>,
): Array<{
  id?: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
}> {
  if (bruto === undefined) return [];
  if (!Array.isArray(bruto)) {
    campos.disponibilidades = 'deve ser uma lista';
    return [];
  }
  if (bruto.length > 30) {
    campos.disponibilidades = 'maximo de 30 disponibilidades';
    return [];
  }
  const itens: Array<{
    id?: string;
    diaSemana: number;
    horaInicio: string;
    horaFim: string;
  }> = [];
  bruto.forEach((item, indice) => {
    if (!ehObjeto(item)) {
      campos[`disponibilidades.${indice}`] = 'disponibilidade invalida';
      return;
    }
    const diaSemana = item.diaSemana;
    const horaInicio = texto(item.horaInicio);
    const horaFim = texto(item.horaFim);
    if (
      typeof diaSemana !== 'number' ||
      !Number.isInteger(diaSemana) ||
      diaSemana < 0 ||
      diaSemana > 6
    ) {
      campos[`disponibilidades.${indice}.diaSemana`] = 'inteiro de 0 a 6';
    }
    if (!horaInicio || !HORA.test(horaInicio)) {
      campos[`disponibilidades.${indice}.horaInicio`] = 'formato HH:MM';
    }
    if (!horaFim || !HORA.test(horaFim)) {
      campos[`disponibilidades.${indice}.horaFim`] = 'formato HH:MM';
    }
    if (horaInicio && horaFim && HORA.test(horaInicio) && HORA.test(horaFim) && horaInicio >= horaFim) {
      campos[`disponibilidades.${indice}.horaFim`] = 'deve ser depois de horaInicio';
      return;
    }
    if (typeof diaSemana !== 'number' || !horaInicio || !horaFim) return;
    if (!HORA.test(horaInicio) || !HORA.test(horaFim)) return;
    const id = texto(item.id);
    itens.push({
      ...(id ? { id } : {}),
      diaSemana,
      horaInicio,
      horaFim,
    });
  });
  return itens;
}

/** Valida o documento completo de mentor vindo da API. */
export function validarMentor(dados: unknown): ResultadoValidacao<MentorValidado> {
  const campos: Record<string, string> = {};
  if (!ehObjeto(dados)) {
    return { ok: false, campos: { corpo: 'objeto esperado' } };
  }

  const nome = texto(dados.nome);
  if (!nome) campos.nome = 'nome obrigatorio';
  else if (nome.length > MAX.nome) campos.nome = `maximo de ${MAX.nome} caracteres`;

  const emailBruto = texto(dados.email);
  if (!emailBruto) campos.email = 'email obrigatorio';
  else if (!EMAIL.test(emailBruto)) campos.email = 'email invalido';
  else if (emailBruto.length > MAX.email) campos.email = `maximo de ${MAX.email} caracteres`;

  const curso = texto(dados.curso) ?? '';
  if (curso.length > MAX.curso) campos.curso = `maximo de ${MAX.curso} caracteres`;

  const bio = texto(dados.bio) ?? '';
  if (bio.length > MAX.bio) campos.bio = `maximo de ${MAX.bio} caracteres`;

  let periodo: number | undefined;
  if (dados.periodo !== undefined && dados.periodo !== null) {
    if (
      typeof dados.periodo !== 'number' ||
      !Number.isInteger(dados.periodo) ||
      dados.periodo < 1 ||
      dados.periodo > 12
    ) {
      campos.periodo = 'inteiro de 1 a 12';
    } else {
      periodo = dados.periodo;
    }
  }

  for (const chave of ['ehMentor', 'ehMentorado'] as const) {
    if (dados[chave] !== undefined && typeof dados[chave] !== 'boolean') {
      campos[chave] = 'booleano esperado';
    }
  }

  const areas = validarAreas(dados.areas, campos);
  const disponibilidades = validarDisponibilidades(dados.disponibilidades, campos);

  if (Object.keys(campos).length > 0) return { ok: false, campos };

  return {
    ok: true,
    valor: {
      nome: nome as string,
      email: (emailBruto as string).toLowerCase(),
      curso,
      ...(periodo !== undefined ? { periodo } : {}),
      bio,
      ehMentor: typeof dados.ehMentor === 'boolean' ? dados.ehMentor : true,
      ehMentorado: typeof dados.ehMentorado === 'boolean' ? dados.ehMentorado : false,
      areas,
      disponibilidades,
    },
  };
}

/** Busca somente mentores visiveis no catalogo (mentor + ao menos uma area). */
export function filtrarMentores(itens: Mentor[], filtro: FiltroMentores): Mentor[] {
  const curso = filtro.curso?.trim();
  const materia = filtro.materia?.trim();
  const q = filtro.q?.trim();

  return itens.filter((mentor) => {
    if (!mentor.ehMentor || mentor.areas.length === 0) return false;
    if (curso && !mentor.areas.some((area) => contemTexto(area.curso, curso))) return false;
    if (materia && !mentor.areas.some((area) => contemTexto(area.materia, materia))) {
      return false;
    }
    if (q) {
      const encontrou =
        contemTexto(mentor.nome, q) ||
        contemTexto(mentor.bio, q) ||
        mentor.areas.some((area) => contemTexto(area.materia, q));
      if (!encontrou) return false;
    }
    return true;
  });
}

export function toResumo(mentor: Mentor): MentorResumo {
  return {
    id: mentor.id,
    nome: mentor.nome,
    curso: mentor.curso,
    periodo: mentor.periodo ?? null,
    bio: mentor.bio,
    areas: mentor.areas,
    disponibilidades: mentor.disponibilidades,
    notas: mentor.avaliacoes.map((avaliacao) => avaliacao.nota),
    totalAvaliacoes: mentor.avaliacoes.length,
  };
}
