// src/components/Breadcrumb.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/breadcrumb.css";

const Breadcrumb = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  return (
    <nav className="breadcrumb">
      <Link to="/">Home</Link>
      {pathnames.map((value, index) => {
        const to = "/" + pathnames.slice(0, index + 1).join("/");
        const isLast = index === pathnames.length - 1;

        return (
          <span key={to}>
            <span className="separator"> &gt; </span>
            {isLast ? (
              <span className="current">{decodeURIComponent(value)}</span>
            ) : (
              <Link to={to}>{decodeURIComponent(value)}</Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
