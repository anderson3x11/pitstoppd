import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import Poster from "./Poster";
import { formatDateShort } from "../lib/dateUtils";

/**
 * GPCard — poster cliquable d'un GP + nom, date, note moyenne.
 * gp: { name, season, slug, date, posterUrl|poster_url, raceType|race_type, avgRating, reviewCount }
 */
export default function GPCard({ gp }) {
  const isSprint = (gp.raceType ?? gp.race_type) === "sprint";
  const displayName = gp.name.replace(/ Sprint$/, "");

  return (
    <Link to={`/gps/${gp.season}/${gp.slug}`} className="group block rounded-md">
      <div className="relative transition-transform duration-200 ease-[var(--ease-out)] group-hover:-translate-y-1">
        <Poster
          race={gp}
          className={`shadow-[0_8px_24px_-12px_rgba(0,0,0,0.8)] transition-shadow duration-200 group-hover:ring-2 group-hover:ring-white/40 ${isSprint ? "ring-sprint/40" : ""}`}
        />
      </div>

      <div className="pt-2.5 space-y-1">
        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-f1-red transition-colors">
          {displayName}
        </h3>
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-xs text-subtle">
          <span className="flex items-center gap-1.5 min-w-0">
            {isSprint && <span className="rounded-sm bg-sprint/15 px-1 text-[11px] font-bold uppercase tracking-wide text-sprint">Sprint</span>}
            <span className="truncate">{gp.date ? formatDateShort(gp.date) : gp.season}</span>
          </span>
          {gp.avgRating != null && (
            <span className="flex items-center gap-1">
              <StarRating value={gp.avgRating} size="sm" />
              <span className="sr-only">{gp.reviewCount} ratings</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
