import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { formatEventDate, formatEventTime } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';

/**
 * Dense, image-first event card — the core visual building block of the
 * homepage/browse grid. Ticket-stub perforation sits between the image
 * and the details as MatchPass's signature motif.
 */
const EventCard = ({ event, size = 'md' }) => {
  const isLarge = size === 'lg';

  return (
    <Link
      to={`/events/${event.slug}`}
      className="card card-hover group flex flex-col overflow-hidden"
    >
      <div className={`relative overflow-hidden ${isLarge ? 'h-48' : 'h-32'}`}>
        <img
          src={event.imageUrl}
          alt={`${event.homeTeam} vs ${event.awayTeam}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-ink/0" />
        <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-700 backdrop-blur-sm">
          {event.league}
        </span>
      </div>

      <div className="ticket-stub-divider mx-4" />

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-xs font-semibold text-slate-400">
          {formatEventDate(event.eventDate)} · {formatEventTime(event.eventDate)}
        </p>
        <p
          className={`font-display font-bold leading-snug text-ink line-clamp-2 ${
            isLarge ? 'text-xl' : 'text-base'
          }`}
        >
          {event.homeTeam} <span className="text-slate-400">vs</span> {event.awayTeam}
        </p>
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={12} className="shrink-0" />
          {event.venue?.name}, {event.venue?.city}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-[11px] text-slate-400">From</span>
          <span className="price-mono text-base text-ink">
            {event.lowestPrice ? formatCurrency(event.lowestPrice) : 'TBA'}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;