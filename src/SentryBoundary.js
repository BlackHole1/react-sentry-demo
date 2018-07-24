import { Component } from "react";
import Raven from "raven-js";

export default class SentryBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error });
    Raven.captureException(error, { extra: errorInfo });
  }

render() {
    if (this.state.error) {
      console.log('React Error')
    }
    return this.props.children;
  }
}
