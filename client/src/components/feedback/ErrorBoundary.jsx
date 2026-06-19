import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-background px-5 text-center text-text">
        <div className="max-w-lg rounded-3xl border border-border bg-surface p-8 shadow-xl">
          <div className="text-sm font-bold uppercase tracking-wider text-primary">EkSaha</div>
          <h1 className="mt-4 text-2xl font-extrabold">The page could not finish loading.</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Refresh the page. If the problem remains, check the browser console for the error below.
          </p>
          <pre className="mt-6 overflow-auto rounded-xl bg-surface-raised p-4 text-left text-xs text-text">
            {this.state.error.message}
          </pre>
          <button
            className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      </main>
    );
  }
}
