import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { Graph3DData, MatrixLayer } from '../types';

interface Graph3DProps {
  data: Graph3DData;
}

export const Graph3D: React.FC<Graph3DProps> = ({ data }) => {
  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!plotRef.current || !data.layers.length) return;

    const traces: any[] = [];
    const zSpacing = 4; // Increased spacing for better edge visibility

    // Pre-calculate all node positions to draw edges
    const allLayerNodes: { x: number; y: number; z: number; val: number }[][] = [];

    data.layers.forEach((layer, layerIdx) => {
      const z = layerIdx * zSpacing;
      const { rows, cols, values, shape } = layer;
      const layerNodes: { x: number; y: number; z: number; val: number }[] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let x = 0;
          let y = 0;

          if (shape === 'rectangle') {
            x = (c - (cols - 1) / 2) * 1.5;
            y = (r - (rows - 1) / 2) * 1.5;
          } else if (shape === 'circle') {
            const angle = (2 * Math.PI * c) / cols;
            const radius = (r + 1) * 1.2;
            x = radius * Math.cos(angle);
            y = radius * Math.sin(angle);
          } else if (shape === 'triangle') {
            x = (c - r / 2) * 1.5;
            y = r * (Math.sqrt(3) / 2) * 1.5;
            // Center the triangle
            y -= (rows * Math.sqrt(3) / 4);
          }

          layerNodes.push({ x, y, z, val: values[r]?.[c] ?? 0 });
        }
      }
      allLayerNodes.push(layerNodes);

      // Add the layer nodes trace
      traces.push({
        x: layerNodes.map(n => n.x),
        y: layerNodes.map(n => n.y),
        z: layerNodes.map(n => n.z),
        mode: 'markers',
        type: 'scatter3d',
        name: layer.name,
        text: layerNodes.map(n => `Value: ${n.val}`),
        hoverinfo: 'text+name',
        marker: {
          size: 6,
          color: layer.color || `hsl(${layerIdx * 60}, 70%, 50%)`,
          opacity: 0.9,
          line: { color: 'white', width: 0.5 }
        }
      });
    });

    // Add inter-layer edges (Fully Connected)
    for (let i = 0; i < allLayerNodes.length - 1; i++) {
      const currentLayer = allLayerNodes[i];
      const nextLayer = allLayerNodes[i + 1];

      // To prevent performance issues with massive matrices, 
      // we limit the number of lines drawn if the layers are huge
      const maxEdges = 200;
      let edgeCount = 0;

      const edgeX: (number | null)[] = [];
      const edgeY: (number | null)[] = [];
      const edgeZ: (number | null)[] = [];

      for (const source of currentLayer) {
        for (const target of nextLayer) {
          if (edgeCount > maxEdges) break;
          
          edgeX.push(source.x, target.x, null);
          edgeY.push(source.y, target.y, null);
          edgeZ.push(source.z, target.z, null);
          edgeCount++;
        }
      }

      traces.push({
        type: 'scatter3d',
        mode: 'lines',
        x: edgeX,
        y: edgeY,
        z: edgeZ,
        line: {
          color: 'rgba(150, 150, 150, 0.15)',
          width: 1
        },
        showlegend: false,
        hoverinfo: 'none',
        name: `Edges ${i}→${i+1}`
      });
    }

    const layout: Partial<Plotly.Layout> = {
      margin: { l: 0, r: 0, b: 0, t: 0 },
      scene: {
        xaxis: { title: 'X', showgrid: true, zeroline: false },
        yaxis: { title: 'Y', showgrid: true, zeroline: false },
        zaxis: { title: 'Layer', showgrid: true, zeroline: false },
        camera: {
          eye: { x: 1.5, y: 1.5, z: 1.5 }
        }
      },
      showlegend: true,
      legend: {
        x: 0,
        y: 1
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)'
    };

    const config = {
      responsive: true,
      displayModeBar: true
    };

    Plotly.newPlot(plotRef.current, traces, layout, config);

    return () => {
      if (plotRef.current) {
        Plotly.purge(plotRef.current);
      }
    };
  }, [data]);

  return (
    <div className="w-full h-[600px] bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
      <div ref={plotRef} className="w-full h-full" />
    </div>
  );
};
