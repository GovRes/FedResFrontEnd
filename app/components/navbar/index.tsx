"use client";
import styles from "./navbarStyles.module.css";
import React, { useState } from "react";
import Link from "next/link";

import { IoClose, IoMenu } from "react-icons/io5";
import Login from "@/app/login/page";

const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };
  const toggleLogin = () => {setShowLogin(!showLogin)}

  const closeMenuOnMobile = () => {
    if (window.innerWidth <= 1150) {
      setShowMenu(false);
    }
  };
  return (
    <header>
      <nav>
        <Link href="/" className={styles.navLogo}>
          Gov Res
        </Link>

        <div className={`${styles.navMenu} ${showMenu ? styles.showMenu : ""}`}>
          <ul className={styles.navList}>
            <li>
              <Link
                className={styles.navLink}
                href="/"
                onClick={closeMenuOnMobile}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                className={styles.navLink}
                href="/pricing"
                onClick={closeMenuOnMobile}
              >
                Pricing
              </Link>
            </li>
            <li>
              <Link
                className={styles.navLink}
                href="/learn-more"
                onClick={closeMenuOnMobile}
              >
                Learn More
              </Link>
            </li>
            <li>
              <Link
                className={styles.navLink}
                href="/about"
                onClick={closeMenuOnMobile}
              >
                About
              </Link>
            </li>
            <li>
              <Link
                className={styles.navLink}
                href="/ally"
                onClick={closeMenuOnMobile}
              >
                Ally
              </Link>
            </li>
            <li>
              {/* <Login /> */}
              <Link
                className={`${styles.navLink} ${styles.navCta}`}
                href="#"
                onClick={toggleLogin}
                >
                Login/Sign Up
                </Link>
                {showLogin ? <Login /> : "Login/Sign Up"}
            </li>
          </ul>
          <div
            className={`${styles.navToggle} ${styles.navClose}`}
            onClick={toggleMenu}
          >
            <IoClose />
          </div>
        </div>

        <div className={styles.navToggle} onClick={toggleMenu}>
          <IoMenu />
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
