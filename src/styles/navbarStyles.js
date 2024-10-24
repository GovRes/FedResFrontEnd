import styled from "styled-components";
import { NavLink } from "react-router-dom";
import { device } from "./globalStyles";
export const Header = styled.header`
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
  background-color: var(--blue-dark);
  z-index: var(--z-fixed);
`;

export const StyledNavLink = styled(NavLink)`
  color: var(--red-med);
  font-weight: var(--font-semi-bold);
  font-family: var(--header-font);
  font-size: 1.75rem;
  transition: color 0.4s;
  &:hover {
    color: var(--white);
  }
`;

export const NavToggle = styled.div`
  font-size: 1.5rem;
  color: var(--red-med);
  cursor: pointer;
  @media ${device.laptop} {
    display: none;
  }
`;
export const NavClose = styled(NavToggle)`
  position: absolute;
  top: 1rem;
  right: 1.5rem;
`;

export const NavContainer = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  height: var(--header-height);
  margin: 1em;
  padding-top: 0.25em;

  @media ${device.laptop} {
    height: calc(var(--header-height) + 1em);
  }
`;

export const NavCta = styled(StyledNavLink)`
  background-color: var(--blue-dark);
  color: var(--white);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  padding: 0.75rem 1.5rem;
`;

export const NavItem = styled.li``;
export const NavList = styled.ul`
  display: flex;
  flex-direction: column;
  row-gap: 2.5rem;
  list-style-type: none;
  padding: 0;
  @media ${device.laptop} {
    flex-direction: row;
    column-gap: 2.5rem;
  }
`;

export const NavLogo = styled(NavLink)`
  color: var(--red-med);
  transition: color 0.4s;
  font-size: 4.2rem;
  font-family: var(--header-font);
`;

export const NavMenu = styled.div.attrs((props) => ({
  className: props.className,
}))`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  right: -100%;
  background-color: var(--blue-dark);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  width: 80%;
  height: 100%;
  padding: 6rem 2rem 0;
  transition: right 0.4s;
  &.show-menu {
    right: 0;
  }

  @media ${device.laptop} {
    position: relative;
    height: var(--header-height);
    margin: 0 1rem;
    top: auto;
    right: auto;
    padding: 1rem;
  }
`;
