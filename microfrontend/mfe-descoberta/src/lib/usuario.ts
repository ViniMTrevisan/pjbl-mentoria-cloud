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

export const CHAVE_USUARIO = 'veterano.usuario';
export const EVENTO_USUARIO = 'veterano:usuario-alterado';
const PADRAO = 'u1';

function ler(): string {
  try {
    const salvo = window.localStorage.getItem(CHAVE_USUARIO);
    if (salvo && USUARIOS.some((usuario) => usuario.id === salvo)) return salvo;
  } catch {
    // sem localStorage: identidade padrão
  }
  return PADRAO;
}

export function usuarioPorId(id: string): Usuario {
  return USUARIOS.find((usuario) => usuario.id === id) ?? USUARIOS[0]!;
}

/** Lê a identidade compartilhada pelo shell e reage à troca de usuário. */
export function useUsuario(): { id: string; usuario: Usuario } {
  const [id, setId] = useState<string>(() => ler());

  useEffect(() => {
    const aoTrocar = (evento: Event) => {
      const detalhe = (evento as CustomEvent<{ usuarioId?: string }>).detail;
      if (detalhe?.usuarioId) setId(detalhe.usuarioId);
    };
    const aoMudarAba = (evento: StorageEvent) => {
      if (evento.key === CHAVE_USUARIO && evento.newValue) setId(evento.newValue);
    };
    window.addEventListener(EVENTO_USUARIO, aoTrocar);
    window.addEventListener('storage', aoMudarAba);
    return () => {
      window.removeEventListener(EVENTO_USUARIO, aoTrocar);
      window.removeEventListener('storage', aoMudarAba);
    };
  }, []);

  return { id, usuario: usuarioPorId(id) };
}
