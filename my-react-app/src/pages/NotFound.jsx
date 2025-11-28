import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <section className="page page--centered">
      <h1>Siden blev ikke fundet</h1>
      <p className="lede">Den rute, du prøvede at åbne, findes ikke.</p>
      <Link className="button" to="/">
        Til forsiden
      </Link>
    </section>
  );
}

export default NotFoundPage;
