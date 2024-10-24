import { createGlobalStyle, styled } from "styled-components";

const size = {
  mobileS: "320px",
  mobileM: "375px",
  mobileL: "425px",
  tablet: "768px",
  laptop: "1024px",
  laptopL: "1440px",
  desktop: "2560px",
};
export const device = {
  mobileS: `(min-width: ${size.mobileS})`,
  mobileM: `(min-width: ${size.mobileM})`,
  mobileL: `(min-width: ${size.mobileL})`,
  tablet: `(min-width: ${size.tablet})`,
  laptop: `(min-width: ${size.laptop})`,
  laptopL: `(min-width: ${size.laptopL})`,
  desktop: `(min-width: ${size.desktop})`,
  desktopL: `(min-width: ${size.desktop})`,
};
const GlobalStyle = createGlobalStyle`
* {
 box-sizing: border-box;
 padding: 0;
 margin: 0;
}

 :root {
//  colors
  --blue-dark: #014662;
  --blue-med: #025f84;
  --green-med: #538a6e;
  --red-med: #bc282a;
  --white: #ffffff;
  --body-color: #fffffff;
  // fonts
  --body-font: "Roboto Condensed", sans-serif;
  --font-regular-weight: 300;
  --font-semi-bold: 600;
  --h2-font-size: 1.25rem;
  --header-font: "Special Elite", system-ui;
  --header-height: 3.5rem;
  --small-font-size: 0.813rem;
  // layers
  --z-fixed: 100;
  --z-tooltip: 10;
  //sizing for layout

}

body {
  background-color: var(--body-color);
  color: var(--text-color);
  font-family: var(--main-font);
  font-style: normal;
  font-optical-sizing: auto;
  font-weight: var(--font-regular-weight);
}

ul {
 list-style: none;
}

a {
 text-decoration: none;
}

  h1{
  font-family: var(--header-font);
  font-weight: var(--font-semi-bold);
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

export const Container = styled.div`
  margin-top: calc(var(--header-height) + 2rem);
  @media ${device.laptop} {
    margin-top: calc(var(--header-height) + 3.03rem);
  }
`;
export default GlobalStyle;
