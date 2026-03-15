import { Link } from "react-router-dom";
import StarRating from "./StarRating";
import { getCountryFlag } from "../lib/countryFlags";

/**
 * GPCard — Grand Prix card
 *
 * Props:
 *  gp.id
 *  gp.name        : "Japanese Grand Prix"
 *  gp.season      : 2024
 *  gp.slug        : "japon"
 *  gp.country     : "Japan"
 *  gp.circuit     : "Suzuka Circuit"
 *  gp.date        : "2024-04-07"
 *  gp.posterUrl   : string | null
 *  gp.avgRating   : number | null
 *  gp.reviewCount : number | null
 */
export default function GPCard({ gp }) {
  const href = `/gps/${gp.season}/${gp.slug}`;

  const formattedDate = gp.date
    ? new Date(gp.date).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <Link
      to={href}
      className="group block transition-transform duration-150 hover:scale-[1.02]"
    >
      <div
        className={`rounded-lg overflow-hidden bg-card border-2 transition-colors duration-150 ${gp.raceType === "sprint" ? "border-white/70 hover:border-white/90" : "border-line hover:border-subtle"}`}
      >
        {/* Poster */}
        <div className="aspect-[2/3] bg-card-hover relative overflow-hidden">
          {gp.posterUrl ? (
            <img
              src={gp.posterUrl}
              alt={gp.name}
              className="h-full w-full object-cover"
            />
          ) : (
            // Styled placeholder when no image
            <div className="h-full w-full flex flex-col items-center justify-center p-3 bg-gradient-to-b from-card-hover to-card">
              <span className="text-4xl mb-2">
                {getCountryFlag(gp.country)}
              </span>
              <span className="text-center text-[11px] font-medium text-subtle uppercase tracking-wide leading-tight">
                {gp.name}
              </span>
            </div>
          )}
          {gp.raceType === "sprint" && (
            <span className="absolute top-2 right-2 px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider bg-white/90 text-black shadow-lg backdrop-blur-sm">
              Sprint
            </span>
          )}
        </div>

        {/* Infos */}
        <div className="p-2.5 space-y-1">
          <p className="text-[11px] text-subtle">{gp.season}</p>
          <h3 className="text-xs font-semibold text-white leading-snug line-clamp-2">
            {gp.name}
          </h3>
          {formattedDate && (
            <p className="text-[11px] text-subtle">{formattedDate}</p>
          )}
          {gp.avgRating != null ? (
            <div className="flex items-center gap-1.5 pt-0.5">
              <StarRating value={gp.avgRating} size="sm" />
              {gp.reviewCount != null && (
                <span className="text-[10px] text-subtle">
                  ({gp.reviewCount})
                </span>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-subtle italic">Not rated yet</p>
          )}
        </div>
      </div>
    </Link>
  );
}
