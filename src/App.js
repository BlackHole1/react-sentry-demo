import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";

class App extends Component {
  componentDidMount() {
    // 延迟2秒，更加直观的看到效果
    setTimeout(() => {
      throw new Error("woops!");
    }, 2000);
  }
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
}

export default App;
