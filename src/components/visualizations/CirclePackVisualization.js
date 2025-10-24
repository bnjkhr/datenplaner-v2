import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { PersonDetailsModal } from '../ui/PersonDetailsModal';

export const CirclePackVisualization = ({ data, personen, skills, datenprodukte, zuordnungen, rollen }) => {
  const svgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 1200, height: 1200 });
  const [hoveredPerson, setHoveredPerson] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Responsive dimensions
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        const height = Math.max(800, width * 0.8); // Mindestens 800px hoch
        setDimensions({ width, height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!data || !svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = 20;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .style('font-family', 'system-ui, -apple-system, sans-serif')
      .style('background', 'transparent');

    // Create hierarchy
    const hierarchy = d3.hierarchy(data)
      .sum(d => {
        // Größe basiert auf Anzahl der Personen
        if (d.personen && d.personen.length > 0) {
          return d.personen.length * 100;
        }
        return 0;
      })
      .sort((a, b) => b.value - a.value);

    // Create pack layout
    const pack = d3.pack()
      .size([width - margin * 2, height - margin * 2])
      .padding(d => {
        // Mehr Padding für höhere Ebenen
        if (d.depth === 0) return 20; // Root
        if (d.depth === 1) return 10; // Hauptkreise
        return 5; // Sub-Kreise
      });

    const root = pack(hierarchy);

    // Create groups
    const g = svg.append('g')
      .attr('transform', `translate(${margin},${margin})`);

    // Draw circles for each node
    const nodes = g.selectAll('g.node')
      .data(root.descendants())
      .join('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x},${d.y})`);

    // Main circles (depth 0 = root, depth 1 = main categories)
    nodes.filter(d => d.depth <= 2)
      .append('circle')
      .attr('r', d => d.r)
      .attr('fill', d => {
        if (d.depth === 0) return 'none'; // Root invisible
        if (d.depth === 1) {
          // Hauptkreise - mit Transparenz
          return d.data.color ? `${d.data.color}40` : '#e5e7eb40';
        }
        if (d.depth === 2) {
          // Sub-Kreise - etwas dunkler
          const parent = d.parent;
          return parent?.data.color ? `${parent.data.color}60` : '#d1d5db60';
        }
        return 'none';
      })
      .attr('stroke', d => {
        if (d.depth === 0) return 'none';
        if (d.depth === 1) {
          return d.data.color || '#9ca3af';
        }
        if (d.depth === 2) {
          const parent = d.parent;
          return parent?.data.color || '#6b7280';
        }
        return 'none';
      })
      .attr('stroke-width', d => {
        if (d.depth === 1) return 3;
        if (d.depth === 2) return 2;
        return 0;
      })
      .attr('opacity', 0.9);

    // Labels for main circles (depth 1) and sub-circles (depth 2)
    nodes.filter(d => d.depth === 1 || d.depth === 2)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', d => {
        // Position label based on circle size
        if (d.depth === 1) {
          return -d.r + 25; // Oben im Kreis
        }
        return -d.r + 18; // Für Sub-Kreise
      })
      .style('font-size', d => {
        if (d.depth === 1) return '16px';
        return '12px';
      })
      .style('font-weight', d => d.depth === 1 ? '700' : '600')
      .style('fill', d => {
        if (d.depth === 1) return '#1f2937';
        return '#374151';
      })
      .style('pointer-events', 'none')
      .text(d => d.data.name);

    // Person badges - nur für Nodes mit Personen
    const personNodes = nodes.filter(d => d.data.personen && d.data.personen.length > 0);

    personNodes.each(function(d) {
      const node = d3.select(this);
      const personen = d.data.personen;
      const r = d.r;

      // Berechne Layout für Personen-Badges - KOMPAKT
      const badgeRadius = Math.min(16, r / 8);
      // Name braucht ca. 30-40px Breite, Badge ist 2*radius breit
      const nameWidth = 35;
      const badgeSpacing = Math.max(nameWidth, badgeRadius * 2.8);

      // Berechne Anzahl der Badges pro Reihe basierend auf Kreisgröße
      const availableWidth = r * 2 - 60;
      const badgesPerRow = Math.max(2, Math.floor(availableWidth / badgeSpacing));

      // Positioniere Badges im Raster
      personen.forEach((person, i) => {
        const row = Math.floor(i / badgesPerRow);
        const col = i % badgesPerRow;
        const rowCount = Math.ceil(personen.length / badgesPerRow);

        // Zentriere das Raster - WICHTIG: Namen brauchen Platz nach unten
        const rowHeight = badgeRadius * 2 + 14; // Badge + Name darunter
        const totalWidth = Math.min(personen.length, badgesPerRow) * badgeSpacing;
        const startX = -totalWidth / 2 + badgeSpacing / 2;
        const startY = -rowCount * rowHeight / 2 + rowHeight / 2 + 15;

        const x = startX + col * badgeSpacing;
        const y = startY + row * rowHeight;

        // Person Badge Group
        const personGroup = node.append('g')
          .attr('transform', `translate(${x},${y})`)
          .attr('class', 'person-badge')
          .style('cursor', 'pointer')
          .on('mouseenter', function(event) {
            setHoveredPerson(person);
            setMousePosition({ x: event.clientX, y: event.clientY });
            d3.select(this).select('circle')
              .transition()
              .duration(200)
              .attr('r', badgeRadius * 1.2)
              .attr('stroke-width', 3);
          })
          .on('mousemove', function(event) {
            setMousePosition({ x: event.clientX, y: event.clientY });
          })
          .on('mouseleave', function() {
            setHoveredPerson(null);
            d3.select(this).select('circle')
              .transition()
              .duration(200)
              .attr('r', badgeRadius)
              .attr('stroke-width', 2);
          })
          .on('click', function(event) {
            event.stopPropagation();
            setSelectedPerson(person);
          });

        // Badge Circle
        personGroup.append('circle')
          .attr('r', badgeRadius)
          .attr('fill', '#ffffff')
          .attr('stroke', person.isM13 ? '#10b981' : '#6b7280')
          .attr('stroke-width', 2)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');

        // Nur Vorname (erster Teil vor dem Leerzeichen)
        const firstName = person.name.split(' ')[0];

        // Name UNTER dem Badge - kompakt aber lesbar
        personGroup.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', `${badgeRadius + 10}px`) // Knapp unter dem Badge
          .style('font-size', '6px')
          .style('font-weight', '600')
          .style('fill', '#1f2937')
          .style('pointer-events', 'none')
          .text(firstName);

        // M13 Badge - im Badge zentriert
        if (person.isM13) {
          personGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.3em')
            .style('font-size', '6px')
            .style('font-weight', '700')
            .style('fill', '#10b981')
            .style('pointer-events', 'none')
            .text('M13');
        }
      });
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, dimensions, personen, skills]);

  return (
    <div ref={containerRef} className="relative w-full">
      <svg ref={svgRef} className="w-full h-auto" />

      {/* Person Details Modal */}
      {selectedPerson && (
        <PersonDetailsModal
          person={selectedPerson}
          skills={skills}
          datenprodukte={datenprodukte}
          zuordnungen={zuordnungen}
          rollen={rollen}
          onClose={() => setSelectedPerson(null)}
        />
      )}

      {/* Tooltip */}
      {hoveredPerson && (
        <div
          className="fixed bg-white rounded-lg shadow-xl p-4 border-2 border-gray-200 max-w-xs z-50 pointer-events-none"
          style={{
            left: `${mousePosition.x + 15}px`,
            top: `${mousePosition.y + 15}px`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-gray-900">{hoveredPerson.name}</h3>
            {hoveredPerson.isM13 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                M13
              </span>
            )}
          </div>

          {hoveredPerson.email && (
            <p className="text-sm text-gray-600 mb-2">{hoveredPerson.email}</p>
          )}

          {hoveredPerson.skillIds && hoveredPerson.skillIds.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-700 mb-1">Skills:</p>
              <div className="flex flex-wrap gap-1">
                {hoveredPerson.skillIds.map(skillId => {
                  const skill = skills.find(s => s.id === skillId);
                  return skill ? (
                    <span
                      key={skillId}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                      style={{ backgroundColor: `${skill.color}40`, color: '#1f2937' }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: skill.color }}
                      />
                      {skill.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {hoveredPerson.kategorien && hoveredPerson.kategorien.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-gray-700 mb-1">Kategorien:</p>
              <div className="flex flex-wrap gap-1">
                {hoveredPerson.kategorien.map((kat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700"
                  >
                    {kat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 justify-center">
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-white"></div>
          <span className="text-sm font-medium text-gray-700">M13</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="w-4 h-4 rounded-full border-2 border-gray-500 bg-white"></div>
          <span className="text-sm font-medium text-gray-700">nicht M13</span>
        </div>
      </div>
    </div>
  );
};
