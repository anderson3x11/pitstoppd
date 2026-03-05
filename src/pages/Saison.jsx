import { useParams, Link } from "react-router-dom";
import GPCard from "../components/GPCard";

const GPS_2024 = [
  {
    id: 1,
    name: "Grand Prix de Bahreïn",
    season: 2024,
    slug: "bahrein",
    country: "Bahreïn",
    circuit: "Circuit International de Bahreïn",
    date: "2024-03-02",
    posterUrl: null,
    avgRating: 3.2,
    reviewCount: 287,
  },
  {
    id: 2,
    name: "Grand Prix d'Arabie Saoudite",
    season: 2024,
    slug: "arabie-saoudite",
    country: "Arabie Saoudite",
    circuit: "Jeddah Corniche Circuit",
    date: "2024-03-09",
    posterUrl: null,
    avgRating: 3.8,
    reviewCount: 341,
  },
  {
    id: 3,
    name: "Grand Prix d'Australie",
    season: 2024,
    slug: "australie",
    country: "Australie",
    circuit: "Circuit Albert Park",
    date: "2024-03-24",
    posterUrl: null,
    avgRating: 4.6,
    reviewCount: 712,
  },
  {
    id: 4,
    name: "Grand Prix de Singapour",
    season: 2024,
    slug: "singapour",
    country: "Singapour",
    circuit: "Marina Bay Street Circuit",
    date: "2024-09-22",
    posterUrl: null,
    avgRating: 4.8,
    reviewCount: 1024,
  },
];

export default function Saison() {
  const { annee } = useParams();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs text-muted mb-2">
          <Link to="/saisons" className="hover:text-white transition-colors">
            Saisons
          </Link>
          <span>/</span>
          <span>{annee}</span>
        </div>
        <h1 className="text-2xl font-black text-white">Saison {annee}</h1>
        <p className="text-sm text-muted mt-1">{GPS_2024.length} Grands Prix</p>
      </div>

      {/* Stats saison */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Champion pilote", value: "Max Verstappen" },
          { label: "Champion constructeur", value: "McLaren" },
          { label: "Grands Prix", value: GPS_2024.length },
          { label: "Vainqueurs différents", value: "6" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-line bg-card px-4 py-3"
          >
            <p className="text-xs text-subtle mb-1">{stat.label}</p>
            <p className="text-sm font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Grille GPs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {GPS_2024.map((gp) => (
          <GPCard key={gp.id} gp={gp} />
        ))}
      </div>
    </div>
  );
}
