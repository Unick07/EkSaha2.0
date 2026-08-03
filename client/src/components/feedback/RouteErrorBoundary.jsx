import { Component } from "react";

export default class RouteErrorBoundary extends Component {
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
      <div className="grid min-h-[50vh] place-items-center px-5 text-center text-text">
        <div className="max-w-md rounded-3xl border border-border bg-surface p-8 shadow-xl">
          <h1 className="text-xl font-extrabold">Couldn't load this page</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            This can happen after a new deploy. Reloading the page usually fixes it.
          </p>
          <button
            className="mt-6 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
