import { Component } from "react";
import Raven from "raven-js";

export default class SentryBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error });
    // 发送错误信息
    Raven.captureException(error, { extra: errorInfo });
  }

  render() {
    if (this.state.error) {
      // 此处可以写成组件，当组件崩溃后，可以替换崩溃的组件
      console.log("React Error");
    }
    return this.props.children;
  }
}
