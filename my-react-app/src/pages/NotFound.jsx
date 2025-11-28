import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <section className="page page--centered">
      <h1>Page not found</h1>
      <p className="lede">The route you tried to reach does not exist.</p>
      <Link className="button" to="/">
        Back home
      </Link>
    </section>
  );
}

export default NotFoundPage;
