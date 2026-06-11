import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 px-5 text-center text-slate-900">
        <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="text-sm font-bold uppercase tracking-wider text-blue-600">Nextexa Lab</div>
          <h1 className="mt-4 text-2xl font-extrabold">The page could not finish loading.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Refresh the page. If the problem remains, check the browser console for the error below.
          </p>
          <pre className="mt-6 overflow-auto rounded-xl bg-slate-950 p-4 text-left text-xs text-slate-200">
            {this.state.error.message}
          </pre>
          <button
            className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      </main>
    );
  }
}
