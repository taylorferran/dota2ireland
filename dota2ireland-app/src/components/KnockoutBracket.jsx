import React, { useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Handle,
  MarkerType,
  Position,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  ConnectionLineType,
  Controls,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Custom node for team matches
const MatchNode = ({ data, isConnectable }) => {
  const { team1, team2, label, result, winner, stage } = data;

  const getBgColor = () => {
    if (stage === "finals") return "bg-zinc-800";
    if (stage === "champion") return "bg-gradient-to-br from-primary/20 to-zinc-900";
    if (stage === "semifinal") return "bg-zinc-800";
    if (stage === "quarterfinal") return "bg-zinc-800";
    return "bg-zinc-800";
  };

  const getBorderColor = () => {
    if (stage === "finals") return "border-primary";
    if (stage === "champion") return "border-primary";
    return "border-white/10";
  };

  return (
    <div className={`p-2 rounded border ${getBorderColor()} ${getBgColor()} min-w-40 shadow-md`}>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="!bg-primary !w-2 !h-2" />

      <div className="text-xs text-white/60 truncate mb-1">{label}</div>

      {team1 && (
        <div className={`text-sm text-white truncate max-w-36 ${winner === team1.name ? "font-bold text-primary" : ""}`}>
          {winner === team1.name && "✓ "}
          {team1.name}
          {result && <span className="ml-1 text-xs font-bold">{result[0]}</span>}
        </div>
      )}

      {team2 && (
        <div className={`text-sm text-white truncate max-w-36 ${winner === team2.name ? "font-bold text-primary" : ""}`}>
          {winner === team2.name && "✓ "}
          {team2.name}
          {result && <span className="ml-1 text-xs font-bold">{result[1]}</span>}
        </div>
      )}

      {!team1 && !team2 && <div className="text-sm text-white truncate">TBD</div>}

      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="!bg-primary !w-2 !h-2" />
    </div>
  );
};

// Seed box component showing just the team in its seed position
const SeedNode = ({ data, isConnectable }) => {
  const { team, seed } = data;

  return (
    <div className="p-2 rounded border border-white/10 bg-zinc-800 min-w-40 shadow-md">
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="!bg-primary !w-2 !h-2 !opacity-0" />

      <div className="text-xs text-white/60 truncate mb-1">{seed}</div>

      <div className="text-sm text-white truncate max-w-36">{team?.name || "TBD"}</div>

      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="!bg-primary !w-2 !h-2" />
    </div>
  );
};

// Custom node types
const nodeTypes = {
  match: MatchNode,
  seed: SeedNode,
};

// Inner component that uses React Flow hooks
const KnockoutBracketFlow = ({ teams, division, season }) => {
  // Sort teams by points to determine seeding
  const sortedTeams = useMemo(() => [...teams].sort((a, b) => b.points - a.points), [teams]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Generate bracket for Season 4 Division 2 (6 teams)
  const generateSeason4Division2Bracket = useCallback(() => {
    const nodes = [];
    const edges = [];

    const xStart = 50;
    const xGap = 250;
    const yStart = 100;
    const yGap = 100;

    // QF: 3rd vs 6th and 4th vs 5th
    nodes.push(
      { id: "seed-3", type: "seed", data: { seed: "3rd Seed", team: sortedTeams[2] }, position: { x: xStart, y: yStart } },
      { id: "seed-6", type: "seed", data: { seed: "6th Seed", team: sortedTeams[5] }, position: { x: xStart, y: yStart + yGap } },
      { id: "qf-1", type: "match", data: { label: "3rd Seed Won", team1: sortedTeams[2], stage: "quarterfinal" }, position: { x: xStart + xGap, y: yStart + yGap / 2 } }
    );

    nodes.push(
      { id: "seed-4", type: "seed", data: { seed: "4th Seed", team: sortedTeams[3] }, position: { x: xStart, y: yStart + yGap * 3 } },
      { id: "seed-5", type: "seed", data: { seed: "5th Seed", team: sortedTeams[4] }, position: { x: xStart, y: yStart + yGap * 4 } },
      { id: "qf-2", type: "match", data: { label: "4th Seed Won", team1: sortedTeams[3], stage: "quarterfinal" }, position: { x: xStart + xGap, y: yStart + yGap * 3.5 } }
    );

    // Add 2nd and 1st seeds
    nodes.push(
      { id: "seed-2", type: "seed", data: { seed: "2nd Seed", team: sortedTeams[1] }, position: { x: xStart + xGap, y: yStart + yGap * 1.5 } },
      { id: "seed-1", type: "seed", data: { seed: "1st Seed", team: sortedTeams[0] }, position: { x: xStart + xGap, y: yStart + yGap * 2.5 } }
    );

    // Semifinals
    nodes.push(
      { id: "sf-1", type: "match", data: { label: "2nd Seed vs 3rd Seed", team1: sortedTeams[1], team2: sortedTeams[2], winner: sortedTeams[1].name, stage: "semifinal" }, position: { x: xStart + xGap * 2, y: yStart + yGap } },
      { id: "sf-2", type: "match", data: { label: "1st Seed vs 4th Seed", team1: sortedTeams[0], team2: sortedTeams[3], winner: sortedTeams[0].name, stage: "semifinal" }, position: { x: xStart + xGap * 2, y: yStart + yGap * 3 } }
    );

    // Finals & Champion
    nodes.push(
      { id: "final", type: "match", data: { label: "2nd Seed vs 1st Seed", team1: sortedTeams[1], team2: sortedTeams[0], stage: "finals" }, position: { x: xStart + xGap * 3, y: yStart + yGap * 2 } },
      { id: "champion", type: "match", data: { label: "👑 Champion", team1: sortedTeams[1], stage: "champion" }, position: { x: xStart + xGap * 4, y: yStart + yGap * 2 } }
    );

    // Edges
    edges.push(
      { id: "e-seed3-qf1", source: "seed-3", target: "qf-1", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-seed6-qf1", source: "seed-6", target: "qf-1", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-seed4-qf2", source: "seed-4", target: "qf-2", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-seed5-qf2", source: "seed-5", target: "qf-2", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-seed2-sf1", source: "seed-2", target: "sf-1", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-qf1-sf1", source: "qf-1", target: "sf-1", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-seed1-sf2", source: "seed-1", target: "sf-2", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-qf2-sf2", source: "qf-2", target: "sf-2", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-sf1-final", source: "sf-1", target: "final", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-sf2-final", source: "sf-2", target: "final", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-final-champion", source: "final", target: "champion", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" }
    );

    return { nodes, edges };
  }, [sortedTeams]);

  // Generate bracket for Season 4 Division 1 (5 teams)
  const generateSeason4Division1Bracket = useCallback(() => {
    const nodes = [];
    const edges = [];

    const xStart = 50;
    const xGap = 250;
    const yStart = 100;
    const yGap = 100;

    // QF: 4th vs 5th
    nodes.push(
      { id: "seed-4", type: "seed", data: { seed: "4th Seed", team: sortedTeams[3] }, position: { x: xStart, y: yStart + yGap * 3 } },
      { id: "seed-5", type: "seed", data: { seed: "5th Seed", team: sortedTeams[4] }, position: { x: xStart, y: yStart + yGap * 4 } },
      { id: "qf-1", type: "match", data: { label: "4th Seed Won", team1: sortedTeams[3], stage: "quarterfinal" }, position: { x: xStart + xGap, y: yStart + yGap * 3.5 } }
    );

    // Seeds for 1st, 2nd, 3rd
    nodes.push(
      { id: "seed-3", type: "seed", data: { seed: "3rd Seed", team: sortedTeams[2] }, position: { x: xStart, y: yStart } },
      { id: "seed-2", type: "seed", data: { seed: "2nd Seed", team: sortedTeams[1] }, position: { x: xStart, y: yStart + yGap } },
      { id: "seed-1", type: "seed", data: { seed: "1st Seed", team: sortedTeams[0] }, position: { x: xStart + xGap, y: yStart + yGap * 2 } }
    );

    // Semifinals
    nodes.push(
      { id: "sf-1", type: "match", data: { label: "3rd Seed Won", team1: sortedTeams[1], team2: sortedTeams[2], winner: sortedTeams[2].name, stage: "semifinal" }, position: { x: xStart + xGap, y: yStart + yGap / 2 } },
      { id: "sf-2", type: "match", data: { label: "1st Seed vs 4th Seed", team1: sortedTeams[0], team2: sortedTeams[3], winner: sortedTeams[0].name, stage: "semifinal" }, position: { x: xStart + xGap * 2, y: yStart + yGap * 3 } }
    );

    // Finals & Champion
    nodes.push(
      { id: "final", type: "match", data: { label: "3rd Seed vs 1st Seed", team1: sortedTeams[2], team2: sortedTeams[0], stage: "finals" }, position: { x: xStart + xGap * 3, y: yStart + yGap * 2 } },
      { id: "champion", type: "match", data: { label: "👑 Champion", team1: sortedTeams[0], stage: "champion" }, position: { x: xStart + xGap * 4, y: yStart + yGap * 2 } }
    );

    // Edges
    edges.push(
      { id: "e-seed4-qf1", source: "seed-4", target: "qf-1", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-seed5-qf1", source: "seed-5", target: "qf-1", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-seed3-sf1", source: "seed-3", target: "sf-1", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-seed2-sf1", source: "seed-2", target: "sf-1", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-seed1-sf2", source: "seed-1", target: "sf-2", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-qf1-sf2", source: "qf-1", target: "sf-2", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-sf1-final", source: "sf-1", target: "final", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-sf2-final", source: "sf-2", target: "final", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-final-champion", source: "final", target: "champion", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" }
    );

    return { nodes, edges };
  }, [sortedTeams]);

  // Generate bracket for Season 4 Division 3 (4 teams)
  const generateSeason4Division3Bracket = useCallback(() => {
    const nodes = [];
    const edges = [];

    const xStart = 50;
    const xGap = 250;
    const yStart = 100;
    const yGap = 100;

    // Seeds (all 4 teams)
    nodes.push(
      { id: "seed-1", type: "seed", data: { seed: "1st Seed", team: sortedTeams[0] }, position: { x: xStart, y: yStart } },
      { id: "seed-4", type: "seed", data: { seed: "4th Seed", team: sortedTeams[3] }, position: { x: xStart, y: yStart + yGap } },
      { id: "seed-2", type: "seed", data: { seed: "2nd Seed", team: sortedTeams[1] }, position: { x: xStart, y: yStart + yGap * 3 } },
      { id: "seed-3", type: "seed", data: { seed: "3rd Seed", team: sortedTeams[2] }, position: { x: xStart, y: yStart + yGap * 4 } }
    );

    // Semifinals
    nodes.push(
      { id: "sf-1", type: "match", data: { label: "1st Seed Won", team1: sortedTeams[0], team2: sortedTeams[3], winner: sortedTeams[0].name, stage: "semifinal" }, position: { x: xStart + xGap, y: yStart + yGap / 2 } },
      { id: "sf-2", type: "match", data: { label: "3rd Seed Won", team1: sortedTeams[1], team2: sortedTeams[2], winner: sortedTeams[2].name, stage: "semifinal" }, position: { x: xStart + xGap, y: yStart + yGap * 3.5 } }
    );

    // Finals & Champion
    nodes.push(
      { id: "final", type: "match", data: { label: "1st Seed vs 3rd Seed", team1: sortedTeams[0], team2: sortedTeams[2], stage: "finals" }, position: { x: xStart + xGap * 2, y: yStart + yGap * 2 } },
      { id: "champion", type: "match", data: { label: "👑 Champion", team1: sortedTeams[0], stage: "champion" }, position: { x: xStart + xGap * 3, y: yStart + yGap * 2 } }
    );

    // Edges
    edges.push(
      { id: "e-seed1-sf1", source: "seed-1", target: "sf-1", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-seed4-sf1", source: "seed-4", target: "sf-1", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-seed2-sf2", source: "seed-2", target: "sf-2", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-seed3-sf2", source: "seed-3", target: "sf-2", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-sf1-final", source: "sf-1", target: "final", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-sf2-final", source: "sf-2", target: "final", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-final-champion", source: "final", target: "champion", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" }
    );

    return { nodes, edges };
  }, [sortedTeams]);

  // Generate bracket for Season 5 Division 1 (5 teams, stepladder)
  const generateSeason5Division1Bracket = useCallback(() => {
    const nodes = [];
    const edges = [];

    const xStart = 50;
    const xGap = 220;
    const yStart = 100;
    const yGap = 120;

    // QF: 4th vs 5th
    nodes.push({
      id: "qf",
      type: "match",
      data: { label: "Quarterfinal (4th vs 5th)", team1: sortedTeams[3], team2: sortedTeams[4], stage: "quarterfinal" },
      position: { x: xStart, y: yStart + yGap },
    });

    // SF1: 1st vs QF winner
    nodes.push({
      id: "sf1",
      type: "match",
      data: { label: "Semifinal 1 (1st vs QF1)", team1: sortedTeams[0], team2: sortedTeams[3], stage: "semifinal" },
      position: { x: xStart + xGap, y: yStart + yGap },
    });

    // SF2: 2nd vs 3rd
    nodes.push({
      id: "sf2",
      type: "match",
      data: { label: "Semifinal 2 (2nd vs 3rd)", team1: sortedTeams[1], team2: sortedTeams[2], stage: "semifinal" },
      position: { x: xStart + xGap, y: yStart },
    });

    // Final
    nodes.push({
      id: "final",
      type: "match",
      data: { label: "Final", team1: sortedTeams[1], team2: sortedTeams[0], stage: "finals" },
      position: { x: xStart + xGap * 2, y: yStart + yGap / 2 },
    });

    // Champion
    nodes.push({
      id: "champion",
      type: "match",
      data: { label: "👑 Champion", team1: sortedTeams[0], stage: "champion" },
      position: { x: xStart + xGap * 3, y: yStart + yGap / 2 },
    });

    // Edges
    edges.push(
      { id: "e-qf-sf1", source: "qf", target: "sf1", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-sf1-final", source: "sf1", target: "final", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-sf2-final", source: "sf2", target: "final", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-final-champion", source: "final", target: "champion", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" }
    );

    return { nodes, edges };
  }, [sortedTeams]);

  // Generate bracket for Season 5 Division 2 (8 teams with hardcoded matchups)
  const generateSeason5Division2Bracket = useCallback(() => {
    const nodes = [];
    const edges = [];

    // Helper to find team by name
    const findTeam = (name) =>
      sortedTeams.find((t) => t.name?.trim().toLowerCase() === name.trim().toLowerCase()) || { name };

    const xStart = 50;
    const xGap = 200;
    const yStart = 100;
    const yGap = 80;

    // Quarterfinals (hardcoded matchups from Season 5)
    nodes.push(
      { id: "qf-1", type: "match", data: { label: "Quarterfinal 1", team1: findTeam("BDC"), team2: findTeam("Lughs Last Hitters"), stage: "quarterfinal" }, position: { x: xStart, y: yStart } },
      { id: "qf-2", type: "match", data: { label: "Quarterfinal 2", team1: findTeam("Fear the Samurai"), team2: findTeam("Cavan Champions"), stage: "quarterfinal" }, position: { x: xStart, y: yStart + yGap } },
      { id: "qf-3", type: "match", data: { label: "Quarterfinal 3", team1: findTeam("Creep Enjoyers"), team2: findTeam("Ausgang"), stage: "quarterfinal" }, position: { x: xStart, y: yStart + yGap * 2 } },
      { id: "qf-4", type: "match", data: { label: "Quarterfinal 4", team1: findTeam("Mike's Army"), team2: findTeam("Cavan Chumpions"), stage: "quarterfinal" }, position: { x: xStart, y: yStart + yGap * 3 } }
    );

    // Semifinals
    nodes.push(
      { id: "sf-1", type: "match", data: { label: "Semifinal 1", team1: findTeam("BDC"), team2: findTeam("Cavan Champions"), stage: "semifinal" }, position: { x: xStart + xGap, y: yStart + yGap / 2 } },
      { id: "sf-2", type: "match", data: { label: "Semifinal 2", team1: findTeam("Creep Enjoyers"), team2: findTeam("Cavan Chumpions"), stage: "semifinal" }, position: { x: xStart + xGap, y: yStart + yGap * 2.5 } }
    );

    // Final
    nodes.push({
      id: "final",
      type: "match",
      data: { label: "Final", team1: findTeam("BDC"), team2: findTeam("Creep Enjoyers"), stage: "finals" },
      position: { x: xStart + xGap * 2, y: yStart + yGap * 1.5 },
    });

    // Champion
    nodes.push({
      id: "champion",
      type: "match",
      data: { label: "👑 Champion", team1: findTeam("Creep Enjoyers"), stage: "champion" },
      position: { x: xStart + xGap * 3, y: yStart + yGap * 1.5 },
    });

    // Edges
    edges.push(
      { id: "e-qf1-sf1", source: "qf-1", target: "sf-1", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-qf2-sf1", source: "qf-2", target: "sf-1", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-qf3-sf2", source: "qf-3", target: "sf-2", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-qf4-sf2", source: "qf-4", target: "sf-2", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-sf1-final", source: "sf-1", target: "final", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-sf2-final", source: "sf-2", target: "final", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-final-champion", source: "final", target: "champion", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" }
    );

    return { nodes, edges };
  }, [sortedTeams]);

  // Generate bracket for Season 5 Division 3 (4 teams)
  const generateSeason5Division3Bracket = useCallback(() => {
    const nodes = [];
    const edges = [];

    const xStart = 50;
    const xGap = 250;
    const yStart = 100;
    const yGap = 120;

    // Semifinals
    nodes.push(
      { id: "sf-1", type: "match", data: { label: "Semifinal 1 (1st vs 4th)", team1: sortedTeams[0], team2: sortedTeams[3], stage: "semifinal" }, position: { x: xStart, y: yStart } },
      { id: "sf-2", type: "match", data: { label: "Semifinal 2 (2nd vs 3rd)", team1: sortedTeams[1], team2: sortedTeams[2], stage: "semifinal" }, position: { x: xStart, y: yStart + yGap } }
    );

    // Final
    nodes.push({
      id: "final",
      type: "match",
      data: { label: "Final", team1: sortedTeams[0], team2: sortedTeams[2], stage: "finals" },
      position: { x: xStart + xGap, y: yStart + yGap / 2 },
    });

    // Champion
    nodes.push({
      id: "champion",
      type: "match",
      data: { label: "👑 Champion", team1: sortedTeams[0], stage: "champion" },
      position: { x: xStart + xGap * 2, y: yStart + yGap / 2 },
    });

    // Edges
    edges.push(
      { id: "e-sf1-final", source: "sf-1", target: "final", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-sf2-final", source: "sf-2", target: "final", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" },
      { id: "e-final-champion", source: "final", target: "champion", markerEnd: { type: MarkerType.Arrow }, style: { stroke: "#13ec5b", strokeWidth: 2 }, type: "smoothstep" }
    );

    return { nodes, edges };
  }, [sortedTeams]);

  // Update nodes and edges when division or teams change
  useEffect(() => {
    let newElements = { nodes: [], edges: [] };

    if (season === 4) {
      if (division === 1) {
        newElements = generateSeason4Division1Bracket();
      } else if (division === 3) {
        newElements = generateSeason4Division3Bracket();
      } else {
        newElements = generateSeason4Division2Bracket();
      }
    } else if (season === 5) {
      if (division === 1) {
        newElements = generateSeason5Division1Bracket();
      } else if (division === 3) {
        newElements = generateSeason5Division3Bracket();
      } else {
        newElements = generateSeason5Division2Bracket();
      }
    }

    setNodes(newElements.nodes);
    setEdges(newElements.edges);
  }, [
    division,
    season,
    teams,
    generateSeason4Division1Bracket,
    generateSeason4Division2Bracket,
    generateSeason4Division3Bracket,
    generateSeason5Division1Bracket,
    generateSeason5Division2Bracket,
    generateSeason5Division3Bracket,
  ]);

  const defaultEdgeOptions = {
    style: { stroke: "#13ec5b", strokeWidth: 2 },
    type: "smoothstep",
    markerEnd: {
      type: MarkerType.Arrow,
    },
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      connectionLineType={ConnectionLineType.SmoothStep}
      connectionLineStyle={{ stroke: "#13ec5b", strokeWidth: 2 }}
      fitView
      minZoom={0.5}
      maxZoom={1.5}
      nodesDraggable={false}
      edgesFocusable={false}
      nodesFocusable={false}
      elementsSelectable={false}
      zoomOnScroll={false}
      panOnScroll={true}
    >
      <Background color="#27272a" gap={16} size={1} />
      <Controls showInteractive={false} className="!bg-zinc-800 !text-white !border-white/10" />
    </ReactFlow>
  );
};

export const KnockoutBracket = ({ teams, division, season }) => {
  if (!teams || teams.length === 0) {
    return (
      <div className="w-full h-[600px] bg-zinc-900 rounded-lg flex items-center justify-center">
        <p className="text-white/60">No teams available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] bg-zinc-900 rounded-lg shadow-lg">
      <ReactFlowProvider>
        <KnockoutBracketFlow teams={teams} division={division} season={season} />
      </ReactFlowProvider>
    </div>
  );
};
