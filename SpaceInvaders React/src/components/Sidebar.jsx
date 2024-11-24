import React from "react";

const Sidebar = ({
  score,
  timeTaken,
  healthLost,
  levelNo,
  levelDifficulty,
}) => {
  return (
    <div style={{ padding: "10px", color: "white", fontFamily: "Arial" }}>
      <h3>Game Stats</h3>
      <p>Score: {score}</p>
      <p>Time Taken: {timeTaken}s</p>
      <p>Health Lost: {healthLost}/1000</p>
      <p>Level: {levelNo}</p>
      <p>Difficulty: {levelDifficulty.toFixed(2)}</p>
    </div>
  );
};

export default Sidebar;
