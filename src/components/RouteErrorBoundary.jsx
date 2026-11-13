import React from 'react';

/** Keep one broken page widget from blanking the entire application shell. */
export class RouteErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Ecominds page failed to render:', error, info.componentStack);
  }

  componentDidUpdate(previousProps) {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <section role="alert" style={{ margin: '24px 0', padding: 24, borderRadius: 18, border: '1px solid rgba(248,113,113,.35)', background: 'rgba(127,29,29,.14)', color: 'var(--text)' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800 }}>This page hit a loading problem</h1>
        <p style={{ margin: '0 0 16px', color: 'var(--text-2)' }}>The rest of Ecominds is still available. Reload this section to try again.</p>
        <button type="button" className="btn-eco" onClick={() => this.setState({ hasError: false })}>Try again</button>
      </section>
    );
  }
}
