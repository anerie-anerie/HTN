import React from "react";

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-text">
                <small>© 2025 Be the Beat</small>

                {/* Bees with random wandering paths */}
                <span className="bee bee1">🐝</span>
                <span className="bee bee2">🐝</span>
                <span className="bee bee3">🐝</span>
            </div>

            <style>{`
        .footer {
          position: relative;
          padding: 40px 0;
          border-top: 1px solid #1f1f1f;
          text-align: center;
          font-size: 14px;
          color: #eaeaea;
          background: #0b0b0b;
          overflow: hidden;
        }

        .footer-text {
          position: relative;
          display: inline-block;
          padding: 20px;
        }

        .bee {
          position: absolute;
          font-size: 22px;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        .bee1 {
          animation: wander1 10s infinite;
        }

        .bee2 {
          animation: wander2 12s infinite;
        }

        .bee3 {
          animation: wander3 14s infinite;
        }

        @keyframes wander1 {
          0%   { transform: translate(0, 0) rotate(0deg); }
          20%  { transform: translate(40px, -20px) rotate(10deg); }
          40%  { transform: translate(-20px, -40px) rotate(-20deg); }
          60%  { transform: translate(30px, 10px) rotate(15deg); }
          80%  { transform: translate(-10px, 30px) rotate(-10deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }

        @keyframes wander2 {
          0%   { transform: translate(0, 0) rotate(0deg); }
          25%  { transform: translate(-30px, -10px) rotate(-15deg); }
          50%  { transform: translate(20px, 30px) rotate(20deg); }
          75%  { transform: translate(-40px, 20px) rotate(-25deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }

        @keyframes wander3 {
          0%   { transform: translate(0, 0) rotate(0deg); }
          15%  { transform: translate(25px, 20px) rotate(10deg); }
          45%  { transform: translate(-30px, 10px) rotate(-15deg); }
          70%  { transform: translate(15px, -25px) rotate(20deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
      `}</style>
        </footer>
    );
}
