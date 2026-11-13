export default function Etiquetas({ lista }) {
  if (!lista || !lista.length) return null;
  return <span className="etiquetas">{lista.join(' · ')}</span>;
}
