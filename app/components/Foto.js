export default function Foto({ url, nombre }) {
  if (!url) return <span className="foto foto-vacia" aria-hidden="true" />;
  return (
    <a href={url} className="foto" target="_blank" rel="noreferrer">
      <img src={url} alt={nombre} loading="lazy" />
    </a>
  );
}
