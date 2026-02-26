import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { Graph3DData, MatrixLayer } from '../types';

interface Graph3DProps {
  data: Graph3DData;
  showLabels?: boolean;
  showLayerNames?: boolean;
  showInterLayerEdges?: boolean;
}

export const Graph3D: React.FC<Graph3DProps> = ({ 
  data, 
  showLabels = false, 
  showLayerNames = false,
  showInterLayerEdges = true 
}) => {
  const plotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!plotRef.current || !data.layers.length) return;

    const traces: any[] = [];
    const zSpacing = 4; // Increased spacing for better edge visibility

    // Pre-calculate all node positions to draw edges
    const allLayerNodes: { x: number; y: number; z: number; val: number }[][] = [];

    data.layers.forEach((layer, layerIdx) => {
      const z = layerIdx * zSpacing;
      const { rows, cols, values, labels, urls, shape } = layer;
      const layerNodes: { x: number; y: number; z: number; val: number; label?: string; url?: string; r: number; c: number }[] = [];

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
            y -= (rows * Math.sqrt(3) / 4);
          }

          layerNodes.push({ 
            x, y, z, 
            val: values[r]?.[c] ?? 0,
            label: labels?.[r]?.[c],
            url: urls?.[r]?.[c],
            r, c 
          });
        }
      }
      allLayerNodes.push(layerNodes as any);

      // Add intra-layer edges to outline the shape
      const intraX: (number | null)[] = [];
      const intraY: (number | null)[] = [];
      const intraZ: (number | null)[] = [];

      const getNode = (r: number, c: number) => layerNodes.find(n => n.r === r && n.c === c);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const current = getNode(r, c);
          if (!current) continue;

          // Horizontal/Ring connections
          const right = getNode(r, (c + 1) % (shape === 'circle' ? cols : Infinity));
          if (right && (shape === 'circle' || c + 1 < cols)) {
            intraX.push(current.x, right.x, null);
            intraY.push(current.y, right.y, null);
            intraZ.push(current.z, right.z, null);
          }

          // Vertical/Radial connections
          const down = getNode(r + 1, c);
          if (down) {
            intraX.push(current.x, down.x, null);
            intraY.push(current.y, down.y, null);
            intraZ.push(current.z, down.z, null);
          }

          // Diagonal connection for Triangle
          if (shape === 'triangle') {
            const diag = getNode(r + 1, c - 1);
            if (diag) {
              intraX.push(current.x, diag.x, null);
              intraY.push(current.y, diag.y, null);
              intraZ.push(current.z, diag.z, null);
            }
          }
        }
      }

      traces.push({
        type: 'scatter3d',
        mode: 'lines',
        x: intraX,
        y: intraY,
        z: intraZ,
        line: { color: layer.color || '#ccc', width: 2, opacity: 0.4 },
        showlegend: false,
        hoverinfo: 'none'
      });

      // Add the layer nodes trace
      traces.push({
        x: layerNodes.map(n => n.x),
        y: layerNodes.map(n => n.y),
        z: layerNodes.map(n => n.z),
        mode: showLabels ? 'markers+text' : 'markers',
        type: 'scatter3d',
        name: layer.name,
        text: layerNodes.map(n => n.label || n.val.toString()),
        textposition: 'top center',
        textfont: { size: 10, color: '#444' },
        hoverinfo: 'text+name',
        marker: {
          size: 6,
          color: layer.color || `hsl(${layerIdx * 60}, 70%, 50%)`,
          opacity: 0.9,
          line: { color: 'white', width: 0.5 }
        },
        customdata: layerNodes.map(n => n.url)
      });

      // Add Layer Name Label if enabled
      if (showLayerNames) {
        traces.push({
          x: [-5], // Position to the left of the layer
          y: [0],
          z: [z],
          mode: 'text',
          type: 'scatter3d',
          text: [layer.name],
          textposition: 'middle left',
          textfont: { size: 14, color: layer.color || '#333', weight: 'bold' },
          showlegend: false,
          hoverinfo: 'none'
        });
      }
    });

    // Add inter-layer edges (Fully Connected)
    if (showInterLayerEdges) {
      for (let i = 0; i < allLayerNodes.length - 1; i++) {
        const currentLayer = allLayerNodes[i];
        const nextLayer = allLayerNodes[i + 1];

        // To prevent performance issues with massive matrices, 
        // we limit the number of lines drawn if the layers are huge
        const maxEdges = 500;
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
            color: data.layers[i].edgeColor || 'rgba(71, 85, 105, 0.6)', // Use specified edgeColor or solid slate gray
            width: 2.0
          },
          showlegend: false,
          hoverinfo: 'none',
          name: `Edges ${i}→${i+1}`
        });
      }
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

    // Add click handler for URLs
    (plotRef.current as any).on('plotly_click', (data: any) => {
      if (data.points && data.points[0] && data.points[0].customdata) {
        const url = data.points[0].customdata;
        if (url && typeof url === 'string' && url.startsWith('http')) {
          window.open(url, '_blank');
        }
      }
    });

    return () => {
      if (plotRef.current) {
        Plotly.purge(plotRef.current);
      }
    };
  }, [data, showLabels, showLayerNames, showInterLayerEdges]);

  return (
    <div className="w-full h-[600px] bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden">
      <div ref={plotRef} className="w-full h-full" />
    </div>
  );
};
