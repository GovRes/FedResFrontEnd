"use client";
import styles from "./navbarStyles.module.css";
import React, { useState } from "react";
import Link from "next/link";

import { IoClose, IoMenu } from "react-icons/io5";

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
              <Link
                className={`${styles.navLink} ${styles.navCta}`}
                href="/login"
                onClick={closeMenuOnMobile}
              >
                Login/Sign Up
              </Link>
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
