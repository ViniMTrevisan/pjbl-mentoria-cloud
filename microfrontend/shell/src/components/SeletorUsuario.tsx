import { USUARIOS } from '../lib/usuario';

interface Props {
  id: string;
  aoTrocar: (id: string) => void;
  compacto?: boolean;
}

/** Seletor da identidade simulada; persiste em `veterano.usuario`. */
export function SeletorUsuario({ id, aoTrocar, compacto = false }: Props) {
  const atual = USUARIOS.find((usuario) => usuario.id === id);

  return (
    <label className={compacto ? 'seletor seletor-compacto' : 'seletor'}>
      <span className="seletor-rotulo">Ver como</span>
      <select value={id} onChange={(evento) => aoTrocar(evento.target.value)}>
        {USUARIOS.map((usuario) => (
          <option key={usuario.id} value={usuario.id}>
            {usuario.nome}
          </option>
        ))}
      </select>
      {!compacto && atual ? (
        <span className="seletor-nota">
          {atual.papel === 'mentor'
            ? 'Você vê e responde pedidos de mentoria.'
            : 'Você busca veteranos e acompanha seus pedidos.'}
        </span>
      ) : null}
    </label>
  );
}
