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
    const zSpacing = 2; // Vertical spacing between layers

    data.layers.forEach((layer, layerIdx) => {
      const z = layerIdx * zSpacing;
      const { rows, cols, values, shape } = layer;
      
      const xCoords: number[] = [];
      const yCoords: number[] = [];
      const zCoords: number[] = [];
      const text: string[] = [];

      // Generate coordinates based on shape
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let x = 0;
          let y = 0;

          if (shape === 'rectangle') {
            x = c - (cols - 1) / 2;
            y = r - (rows - 1) / 2;
          } else if (shape === 'circle') {
            const angle = (2 * Math.PI * c) / cols;
            const radius = r + 1;
            x = radius * Math.cos(angle);
            y = radius * Math.sin(angle);
          } else if (shape === 'triangle') {
            // Simple triangle grid mapping
            x = c - r / 2;
            y = r * (Math.sqrt(3) / 2);
          }

          xCoords.push(x);
          yCoords.push(y);
          zCoords.push(z);
          text.push(`Val: ${values[r]?.[c] ?? 0}`);
        }
      }

      // Add the layer nodes
      traces.push({
        x: xCoords,
        y: yCoords,
        z: zCoords,
        mode: 'markers+text',
        type: 'scatter3d',
        name: layer.name,
        text: text,
        textposition: 'top center',
        marker: {
          size: 8,
          color: layer.color || `hsl(${layerIdx * 60}, 70%, 50%)`,
          opacity: 0.8,
          line: {
            color: 'white',
            width: 1
          }
        },
        hoverinfo: 'text+name'
      });

      // Add connections between layers if not the last layer
      if (layerIdx < data.layers.length - 1) {
        const nextLayer = data.layers[layerIdx + 1];
        // For simplicity, connect corresponding indices or center points
        // Here we'll just draw a few sample connections to show the 3D structure
        // In a real neural net, this would be based on weights
      }
    });

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
