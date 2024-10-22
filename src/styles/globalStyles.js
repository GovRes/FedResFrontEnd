import { createGlobalStyle } from "styled-components";
const GlobalStyle = createGlobalStyle`

  :root {
  --blue-dark: #014662;
  --blue-med: #025f84;
  --green-med: #538a6e;
  --red-med: #bc282a;
  --white: #ffffff;
}
  body {
    padding: 100px;
    font-family: "Roboto Condensed", sans-serif;
    font-style: normal;
    font-optical-sizing: auto;
    font-weight: 300;
  }

  h1{
  font-family: "Special Elite", system-ui;
  font-weight: 400;
  font-style: normal;
  color: var(--red-med);
  }

  .header {
  background-color: var(--blue-med);
  padding: 10px 20px;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

`;

export default GlobalStyle;
