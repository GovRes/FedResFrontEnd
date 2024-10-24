import styled from "styled-components";
import { Container } from "./styles/globalStyles";
const Banner = styled.div`
  color: var(--white);
  background-color: var(--red-med);
  font-family: var(--header-font);
  font-size: 3rem;
  padding: 0.35em;
  a {
    color: var(--white);
  }
`;
const Home = () => {
  return (
    <Container>
      <Banner>
        <a href="/">Try two weeks for free!</a>
      </Banner>
    </Container>
  );
};

export default Home;
