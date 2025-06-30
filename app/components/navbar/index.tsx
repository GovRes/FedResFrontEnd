"use client";
import styles from "./navbarStyles.module.css";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthenticator } from "@aws-amplify/ui-react";

import { IoClose, IoMenu } from "react-icons/io5";
import NavLogin from "./NavLogin";
import { useSearchParams } from "next/navigation";

export const Navbar = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };
  const { authStatus, user, signOut } = useAuthenticator((context) => [
    context.user,
    context.signOut,
  ]);
  const searchParams = useSearchParams();
  const login = searchParams.get("login");

  const toggleLogin = () => {
    setShowLogin(!showLogin);
  };

  useEffect(() => {
    if (login === "true") {
      setShowLogin(true);
    }
  }, [login]);

  useEffect(() => {
    if (user) {
      setShowLogin(true);
    }
  }, [user]);

  const closeMenuOnMobile = () => {
    if (window.innerWidth <= 1150) {
      setShowMenu(false);
    }
  };

  return (
    <header>
      <nav>
        <Link href="/" className={styles.navLogo}>
          GovRes
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
            {authStatus !== "configuring" && user && (
              <li>
                <Link
                  className={styles.navLink}
                  href="/profile"
                  onClick={closeMenuOnMobile}
                >
                  Profile
                </Link>
              </li>
            )}
            <li>
              {authStatus !== "configuring" && user ? (
                <div className={styles.userMenu}>
                  <span>Hello {user.signInDetails?.loginId}</span>
                  <button onClick={() => signOut()}>Sign out</button>
                </div>
              ) : showLogin ? (
                <NavLogin setShowLogin={setShowLogin} />
              ) : (
                <span className={styles.navLink} onClick={toggleLogin}>
                  Login/Sign Up
                </span>
              )}
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
