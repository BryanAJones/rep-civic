import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { service } from '../../services';
import './OnboardingPage.css';

export function OnboardingPage() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { dispatch } = useUser();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const districts = await service.resolveDistricts(address.trim());
      dispatch({ type: 'COMPLETE_ONBOARDING', districts });
      navigate('/app/feed', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve districts');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="onboarding">
      <div className="onboarding__hero">
        <div className="onboarding__logo">
          Rep<span className="onboarding__period">.</span>
        </div>
        <div className="onboarding__tagline">Civic accountability platform</div>
        <p className="onboarding__desc">
          Every person who represents you, in one place.
        </p>
      </div>

      <form className="onboarding__body" onSubmit={handleSubmit}>
        <label className="onboarding__label" htmlFor="address-input">
          Home address
        </label>
        <input
          id="address-input"
          className="onboarding__input"
          type="text"
          placeholder="123 Main St, Atlanta, GA 30315"
          value={address}
          maxLength={200}
          onChange={(e) => setAddress(e.target.value)}
          disabled={loading}
        />

        {error && <p className="onboarding__error">{error}</p>}

        <button
          type="submit"
          className="onboarding__submit"
          disabled={loading || !address.trim()}
        >
          {loading ? 'Finding representatives...' : 'Find my representatives'}
        </button>

        <p className="onboarding__fine">
          Your address is used only to determine your voting districts.
          It is not stored or shared.
        </p>
      </form>
    </div>
  );
}
