import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{display:"flex", gap:16, padding:"12px 0", borderBottom:"1px solid #1f1f1f"}}>
      <Link to="/" style={{color:"#ff2b2b", textDecoration:"none"}}>Home</Link>
      <Link to="/record" style={{color:"#ff2b2b", textDecoration:"none"}}>Record</Link>
      <Link to="/gallery" style={{color:"#ff2b2b", textDecoration:"none"}}>Gallery</Link>
    </nav>
  );
}
