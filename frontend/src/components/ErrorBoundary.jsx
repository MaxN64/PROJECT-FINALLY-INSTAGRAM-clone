import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("React error boundary", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16 }}>
          <h2>Упс! Что-то пошло не так.</h2>
          <p>{this.state.error?.message || "Unknown error"}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Обновить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
