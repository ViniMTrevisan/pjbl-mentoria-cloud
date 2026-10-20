import { useEffect, useState } from 'react';

export interface Usuario {
  id: string;
  nome: string;
  papel: 'mentorado' | 'mentor';
}

export const USUARIOS: Usuario[] = [
  { id: 'u1', nome: 'Bruno Calouro', papel: 'mentorado' },
  { id: 'u2', nome: 'Ana Beatriz Moraes', papel: 'mentor' },
  { id: 'u3', nome: 'João Vitor Salles', papel: 'mentor' },
  { id: 'u4', nome: 'Mariana Lopes', papel: 'mentor' },
  { id: 'u5', nome: 'Fernanda Lima', papel: 'mentor' },
];

const CHAVE = 'veterano.usuario';
const EVENTO = 'veterano:usuario-alterado';
const PADRAO = 'u1';

function ler(): string {
  try {
    const salvo = window.localStorage.getItem(CHAVE);
    if (salvo && USUARIOS.some((usuario) => usuario.id === salvo)) return salvo;
  } catch {
    // identidade padrão quando não há storage
  }
  return PADRAO;
}

export function usuarioPorId(id: string): Usuario {
  return USUARIOS.find((usuario) => usuario.id === id) ?? USUARIOS[0]!;
}

export function useUsuario(): { id: string; usuario: Usuario } {
  const [id, setId] = useState<string>(() => ler());

  useEffect(() => {
    const aoTrocar = (evento: Event) => {
      const detalhe = (evento as CustomEvent<{ usuarioId?: string }>).detail;
      if (detalhe?.usuarioId) setId(detalhe.usuarioId);
    };
    const aoMudarAba = (evento: StorageEvent) => {
      if (evento.key === CHAVE && evento.newValue) setId(evento.newValue);
    };
    window.addEventListener(EVENTO, aoTrocar);
    window.addEventListener('storage', aoMudarAba);
    return () => {
      window.removeEventListener(EVENTO, aoTrocar);
      window.removeEventListener('storage', aoMudarAba);
    };
  }, []);

  return { id, usuario: usuarioPorId(id) };
}

/* ------- controle local de avaliações já enviadas ------- */

const CHAVE_AVALIACOES = 'veterano.avaliacoes';

function lerAvaliacoes(): string[] {
  try {
    const bruto = window.localStorage.getItem(CHAVE_AVALIACOES);
    const lista: unknown = bruto ? JSON.parse(bruto) : [];
    return Array.isArray(lista) ? lista.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function salvarAvaliacoes(lista: string[]): void {
  try {
    window.localStorage.setItem(CHAVE_AVALIACOES, JSON.stringify(lista.slice(-200)));
  } catch {
    // sem persistência local, o 409 do servidor ainda protege contra duplicidade
  }
}

export function chaveAvaliacao(usuarioId: string, sessaoId: string): string {
  return `${usuarioId}:${sessaoId}`;
}

/** Sessões já avaliadas por este usuário, com persistência local. */
export function useAvaliacoes(usuarioId: string): {
  foiAvaliada: (sessaoId: string) => boolean;
  marcarAvaliada: (sessaoId: string) => void;
} {
  const [chaves, setChaves] = useState<string[]>(() => lerAvaliacoes());

  useEffect(() => {
    setChaves(lerAvaliacoes());
  }, [usuarioId]);

  const foiAvaliada = (sessaoId: string) => chaves.includes(chaveAvaliacao(usuarioId, sessaoId));

  const marcarAvaliada = (sessaoId: string) => {
    const chave = chaveAvaliacao(usuarioId, sessaoId);
    if (chaves.includes(chave)) return;
    const proximas = [...chaves, chave];
    setChaves(proximas);
    salvarAvaliacoes(proximas);
  };

  return { foiAvaliada, marcarAvaliada };
}
