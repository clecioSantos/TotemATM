import Link from "next/link";
import "./globals.css";

export default function HomePage() {
  return (
    <main className="home-page">
      <h1>Bem-vindo ao NexOrder</h1>
      <p>Escolha uma área para acessar:</p>
      <div className="home-links">
        <Link href="/admin" className="home-link">Admin</Link>
        <Link href="/totem" className="home-link">Totem</Link>
        <Link href="/kitchen" className="home-link">Kitchen</Link>
      </div>
    </main>
  );
}
