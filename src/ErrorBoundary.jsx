import React from "react";

export default class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f4f2ec] p-6">
          <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-bold text-[#2f3b2f] mb-2">Something went wrong</h1>
            <p className="text-sm text-[#5c6b57] mb-4">
              The app hit an error while loading. Try refreshing the page. If it keeps happening, check the browser console.
            </p>
            <pre className="text-xs bg-[#f4f2ec] p-3 rounded overflow-auto text-red-700 mb-4">{String(this.state.error?.message || this.state.error)}</pre>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded text-white text-sm font-semibold"
              style={{ backgroundColor: "#8a5a2e" }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
