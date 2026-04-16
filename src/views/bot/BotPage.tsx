import { useNavigate } from 'react-router-dom';
import './BotPage.css';

export function BotPage() {
  const navigate = useNavigate();

  return (
    <div className="bot">
      <div className="bot__hero">
        <div className="bot__logo">
          Rep<span className="bot__period">.</span>
        </div>
        <div className="bot__tagline">About the Rep. data bot</div>
      </div>

      <div className="bot__body">
        <h2 className="bot__heading">What this bot does</h2>
        <p className="bot__text">
          Rep. aggregates publicly available election data so constituents can
          see who is running for office in their district. A scheduled job
          fetches candidate records from public sources and refreshes our
          listings nightly.
        </p>

        <h2 className="bot__heading">Sources we read</h2>
        <ul className="bot__list">
          <li>Congress.gov member API (sitting federal House and Senate)</li>
          <li>FEC bulk candidate master file (federal challengers)</li>
          <li>OpenStates current legislators CSV (sitting state legislators)</li>
          <li>Ballotpedia public race pages (state legislative challengers)</li>
        </ul>

        <h2 className="bot__heading">How to identify the bot</h2>
        <p className="bot__text">
          Outbound requests carry the User-Agent string:
        </p>
        <pre className="bot__code">RepBot/0.1 (+https://getrep.org/bot; getrep.org@gmail.com)</pre>

        <h2 className="bot__heading">Contact</h2>
        <p className="bot__text">
          If you operate one of the sources above and have questions, concerns,
          or would like us to stop, please reach out:
        </p>
        <p className="bot__contact">
          <a href="mailto:getrep.org@gmail.com">getrep.org@gmail.com</a>
        </p>
        <p className="bot__text">
          We will respond and adjust crawl behavior or remove the source from
          our pipeline as needed.
        </p>

        <button
          type="button"
          className="bot__back"
          onClick={() => navigate('/')}
        >
          Back to Rep.
        </button>
      </div>
    </div>
  );
}
