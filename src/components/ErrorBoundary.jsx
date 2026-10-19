import { Component } from 'react';

// Shows what went wrong instead of a blank page (e.g. WebGL unavailable).
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return this.props.fallback(this.state.error);
  }
}
