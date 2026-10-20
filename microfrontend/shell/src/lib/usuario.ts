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
export const PADRAO = 'u1';

export function lerUsuarioId(): string {
  try {
    const salvo = window.localStorage.getItem(CHAVE_USUARIO);
    if (salvo && USUARIOS.some((usuario) => usuario.id === salvo)) return salvo;
  } catch {
    // localStorage bloqueado (modo privado): cai no padrão.
  }
  return PADRAO;
}

export function usuarioPorId(id: string): Usuario {
  return USUARIOS.find((usuario) => usuario.id === id) ?? USUARIOS[0]!;
}

export function salvarUsuarioId(id: string): void {
  try {
    window.localStorage.setItem(CHAVE_USUARIO, id);
  } catch {
    // sem persistência, mas a sessão atual continua funcionando
  }
  window.dispatchEvent(new CustomEvent(EVENTO_USUARIO, { detail: { usuarioId: id } }));
}

/** Usuário atual compartilhado entre shell e remotes via localStorage + evento. */
export function useUsuario(): {
  id: string;
  usuario: Usuario;
  definirUsuario: (id: string) => void;
} {
  const [id, setId] = useState<string>(() => lerUsuarioId());

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

  useEffect(() => {
    const usuario = usuarioPorId(id);
    document.title = `Veterano · ${usuario.nome.split(' ')[0]}`;
  }, [id]);

  const definirUsuario = (novo: string) => {
    if (!USUARIOS.some((usuario) => usuario.id === novo)) return;
    salvarUsuarioId(novo);
    setId(novo);
  };

  return { id, usuario: usuarioPorId(id), definirUsuario };
}
