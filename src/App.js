import React, { Fragment } from "react";
import Header from "./Header";
import GlobalStyle from "./styles/globalStyles";
function App() {
  return (
    <Fragment>
      <GlobalStyle />
      <div className="App">
        <Header />
        <header className="App-header">
          <h1>FedREs</h1>
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    </Fragment>
  );
}

export default App;
