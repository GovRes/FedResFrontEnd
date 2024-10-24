import styled from "styled-components";
const FooterContainer = styled.footer`
  display: flex;
  flex-direction: row;
`;
export default function Header() {
  return (
    <FooterContainer>
      <div></div>
      <div>GovRes Address contact@govres.ai</div>
      <div>Privacy Policy and Terms of Service</div>
    </FooterContainer>
  );
}
