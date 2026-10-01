import { Link, useRouteError } from 'react-router-dom'

export default function NotFound() {
  const error = useRouteError()
  const missing = !error || error.status === 404

  return (
    <div className="mx-auto max-w-6xl px-4 py-24">
      <p className="font-display font-bold text-[7rem] sm:text-[9rem] leading-none text-line-strong select-none" aria-hidden="true">
        {missing ? 'DNF' : 'Red flag'}
      </p>
      <h1 className="page-title mt-2">{missing ? 'Page not found' : 'Something broke'}</h1>
      <p className="mt-3 text-muted max-w-md">
        {missing
          ? "This page retired before the finish. It may have moved, or the link is wrong."
          : 'An unexpected error stopped this page. Reload, or head back to the paddock.'}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/" className="btn btn-primary">Back to home</Link>
        <Link to="/gps" className="btn btn-secondary">Browse Grands Prix</Link>
      </div>
    </div>
  )
}
