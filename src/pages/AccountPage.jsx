import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Copy, KeyRound, LogOut, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function formatError(error) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export default function AccountPage() {
  const { status, user, recoveryCode, register, recover, rotateRecoveryCode, clearRecoveryCode, logout } = useAuth();
  const [claimUsername, setClaimUsername] = useState('');
  const [recoverUsernameValue, setRecoverUsernameValue] = useState('');
  const [recoverCodeValue, setRecoverCodeValue] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [copyState, setCopyState] = useState('');

  const accountSubtitle = useMemo(
    () => (user
      ? 'Your StreamVault identity is pseudonymous. Only your username is shared publicly.'
      : 'Claim a username with no email, phone number, or personal profile data.'),
    [user],
  );

  async function copyRecoveryCode() {
    if (!recoveryCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(recoveryCode);
      setCopyState('Recovery code copied.');
    } catch {
      setCopyState('Copy failed. Save the recovery code manually.');
    }
  }

  async function handleClaimAccount(event) {
    event.preventDefault();
    setBusyAction('claim');
    setErrorMessage('');

    try {
      await register(claimUsername);
      setClaimUsername('');
      setCopyState('');
    } catch (error) {
      setErrorMessage(formatError(error));
    } finally {
      setBusyAction('');
    }
  }

  async function handleRecoverAccount(event) {
    event.preventDefault();
    setBusyAction('recover');
    setErrorMessage('');

    try {
      await recover(recoverUsernameValue, recoverCodeValue);
      setRecoverCodeValue('');
      setCopyState('');
    } catch (error) {
      setErrorMessage(formatError(error));
    } finally {
      setBusyAction('');
    }
  }

  async function handleRotateRecoveryCode() {
    setBusyAction('rotate');
    setErrorMessage('');

    try {
      await rotateRecoveryCode();
      setCopyState('');
    } catch (error) {
      setErrorMessage(formatError(error));
    } finally {
      setBusyAction('');
    }
  }

  async function handleLogout() {
    setBusyAction('logout');
    setErrorMessage('');

    try {
      await logout();
      setCopyState('');
      setRecoverCodeValue('');
    } catch (error) {
      setErrorMessage(formatError(error));
    } finally {
      setBusyAction('');
    }
  }

  if (status === 'loading') {
    return (
      <div className="loading-container" style={{ marginTop: 'var(--nav-height)' }}>
        <Helmet>
          <title>Account — TM</title>
        </Helmet>
        <div className="spinner" />
        <span className="loading-text">Checking your session...</span>
      </div>
    );
  }

  return (
    <div className="account-page">
      <Helmet>
        <title>Account — TM</title>
        <meta name="description" content="Manage your StreamVault username, session, and recovery code." />
      </Helmet>

      <div className="account-page__hero">
        <span className="account-page__eyebrow">
          <ShieldCheck size={16} /> Username-Only Access
        </span>
        <h1 className="account-page__title">Account</h1>
        <p className="account-page__subtitle">{accountSubtitle}</p>
      </div>

      {errorMessage && (
        <div className="error-message">
          <span className="error-message__icon"><ShieldCheck size={18} /></span>
          <span>{errorMessage}</span>
        </div>
      )}

      {user ? (
        <div className="account-grid">
          <section className="account-card">
            <div className="account-card__header">
              <span className="account-card__icon"><UserRound size={18} /></span>
              <div>
                <h2 className="account-card__title">Signed in</h2>
                <p className="account-card__copy">This identity is public only as a username.</p>
              </div>
            </div>

            <div className="account-page__username">@{user.username}</div>
            <p className="account-page__meta">Created {new Date(user.createdAt).toLocaleDateString()}</p>

            <div className="account-page__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handleRotateRecoveryCode}
                disabled={busyAction === 'rotate'}
              >
                <RefreshCw size={16} /> {busyAction === 'rotate' ? 'Refreshing...' : 'Rotate Recovery Code'}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleLogout}
                disabled={busyAction === 'logout'}
              >
                <LogOut size={16} /> {busyAction === 'logout' ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </section>

          <section className="account-card account-card--accent">
            <div className="account-card__header">
              <span className="account-card__icon"><KeyRound size={18} /></span>
              <div>
                <h2 className="account-card__title">Recovery code</h2>
                <p className="account-card__copy">Save this somewhere safe. It is the only way to reclaim this username.</p>
              </div>
            </div>

            {recoveryCode ? (
              <>
                <div className="account-secret__code">{recoveryCode}</div>
                <div className="account-page__actions">
                  <button type="button" className="btn btn--primary" onClick={copyRecoveryCode}>
                    <Copy size={16} /> Copy code
                  </button>
                  <button type="button" className="btn btn--ghost" onClick={clearRecoveryCode}>
                    Hide code
                  </button>
                </div>
                {copyState && <p className="account-card__hint">{copyState}</p>}
              </>
            ) : (
              <p className="account-card__hint">Generate a fresh recovery code whenever you want to rotate the credential.</p>
            )}
          </section>
        </div>
      ) : (
        <div className="account-grid">
          <section className="account-card">
            <div className="account-card__header">
              <span className="account-card__icon"><UserRound size={18} /></span>
              <div>
                <h2 className="account-card__title">Claim a username</h2>
                <p className="account-card__copy">Pick the name people will see on parties, reviews, and shared lists.</p>
              </div>
            </div>

            <form className="account-form" onSubmit={handleClaimAccount}>
              <label className="account-form__label" htmlFor="account-claim-username">Username</label>
              <input
                id="account-claim-username"
                className="account-input"
                type="text"
                placeholder="for example watchchief"
                value={claimUsername}
                onChange={(event) => setClaimUsername(event.target.value)}
                autoComplete="username"
              />
              <p className="account-card__hint">Use 3-20 letters, numbers, or underscores. No email required.</p>
              <button type="submit" className="btn btn--primary" disabled={busyAction === 'claim'}>
                {busyAction === 'claim' ? 'Claiming...' : 'Claim Username'}
              </button>
            </form>
          </section>

          <section className="account-card account-card--accent">
            <div className="account-card__header">
              <span className="account-card__icon"><KeyRound size={18} /></span>
              <div>
                <h2 className="account-card__title">Recover an existing username</h2>
                <p className="account-card__copy">Use the recovery code you saved when the username was created or last recovered.</p>
              </div>
            </div>

            <form className="account-form" onSubmit={handleRecoverAccount}>
              <label className="account-form__label" htmlFor="account-recover-username">Username</label>
              <input
                id="account-recover-username"
                className="account-input"
                type="text"
                placeholder="watchchief"
                value={recoverUsernameValue}
                onChange={(event) => setRecoverUsernameValue(event.target.value)}
                autoComplete="username"
              />

              <label className="account-form__label" htmlFor="account-recovery-code">Recovery code</label>
              <input
                id="account-recovery-code"
                className="account-input account-input--mono"
                type="text"
                placeholder="ABCD-EFGH-JKLM-NPQR"
                value={recoverCodeValue}
                onChange={(event) => setRecoverCodeValue(event.target.value.toUpperCase())}
                autoComplete="off"
              />

              <button type="submit" className="btn btn--primary" disabled={busyAction === 'recover'}>
                {busyAction === 'recover' ? 'Recovering...' : 'Recover Username'}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}