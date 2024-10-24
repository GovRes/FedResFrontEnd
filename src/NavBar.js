import React, { useState } from "react";

import { IoClose, IoMenu } from "react-icons/io5";
import {
  Header,
  NavClose,
  NavContainer,
  NavCta,
  NavItem,
  NavList,
  NavLogo,
  NavMenu,
  NavToggle,
  StyledNavLink,
} from "./styles/navbarStyles";

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const closeMenuOnMobile = () => {
    if (window.innerWidth <= 1150) {
      setShowMenu(false);
    }
  };
  return (
    <Header>
      <NavContainer>
        <NavLogo to="/">Gov Res</NavLogo>

        <NavMenu className={`${showMenu ? "show-menu" : ""}`}>
          <NavList>
            <NavItem>
              <StyledNavLink to="/" onClick={closeMenuOnMobile}>
                Home
              </StyledNavLink>
            </NavItem>
            <NavItem>
              <StyledNavLink to="/pricing" onClick={closeMenuOnMobile}>
                Pricing
              </StyledNavLink>
            </NavItem>
            <NavItem>
              <StyledNavLink to="/learn-more" onClick={closeMenuOnMobile}>
                Learn More
              </StyledNavLink>
            </NavItem>
            <NavItem>
              <StyledNavLink to="/about" onClick={closeMenuOnMobile}>
                About
              </StyledNavLink>
            </NavItem>
            <NavItem>
              <NavCta to="/login" onClick={closeMenuOnMobile}>
                Login/Sign Up
              </NavCta>
            </NavItem>
          </NavList>
          <NavClose onClick={toggleMenu}>
            <IoClose />
          </NavClose>
        </NavMenu>

        <NavToggle onClick={toggleMenu}>
          <IoMenu />
        </NavToggle>
      </NavContainer>
    </Header>
  );
};

export default Navbar;
