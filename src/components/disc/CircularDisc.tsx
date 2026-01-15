import { useMemo, useState } from 'react'
import type { Disc, ActivityRenderData, RingRenderData } from '@/types'
import { dateToAngle, polarToCartesian } from '@/lib/polar-utils';
import { useDiscStore } from '@/stores/disc-store';
import { useUIStore } from '@/stores/ui-store';

interface CircularDiscProps {
  disc: Disc;
}
export const CircularDisc = ({
  disc
}: CircularDiscProps) => {
  const { saveDisc } = useDiscStore();
  const { selectedActivityId, openActivityDrawer, filters } = useUIStore();
  const [isEditDiscOpen, setIsEditDiscOpen] = useState(false);
  const [editDiscName, setEditDiscName] = useState(disc.name);


  const { centerRadius, maxRadius, ringData, timeTicks } = useMemo(() => {
    const centerRadius = 80
    const maxRadius = 320
    const ringPadding = 0

    // Separate normal and thin rings
    // Log rings with invalid types
    disc.rings.forEach(ring => {
      if (ring.type !== 'normal' && ring.type !== 'thin') {
        console.warn(`Ring ${ring.id} has invalid type: ${ring.type}. Defaulting to 'normal'.`);
      }
    });

    // Treat rings with invalid types as normal rings
    const normalRings = disc.rings.filter(ring => ring.type !== 'thin');
    const thinRings = disc.rings.filter(ring => ring.type === 'thin');

    // Calculate ring positions with proper spacing
    const totalNormalRings = normalRings.length;
    const totalThinRings = thinRings.length;

    // Reserve space for thin rings at the outer edge
    const thinRingHeight = 10; // Fixed height for thin rings
    const thinRingsSpace = totalThinRings > 0 ? (totalThinRings * thinRingHeight) + ((totalThinRings - 1) * ringPadding) : 0;

    // Calculate available space for normal rings
    const availableRadius = maxRadius - centerRadius - thinRingsSpace - (totalThinRings > 0 ? ringPadding : 0);
    const normalRingHeight = totalNormalRings > 0 ? (availableRadius - ((totalNormalRings - 1) * ringPadding)) / totalNormalRings : 0;

    // Filter rings based on the filter state
    const filteredRings = filters.ringIds.length > 0
      ? disc.rings.filter(ring => filters.ringIds.includes(ring.id))
      : disc.rings;

    // Sort rings to ensure thin rings are on the outside
    const sortedRings = [...filteredRings].sort((a, b) => {
      if (a.type === 'thin' && b.type !== 'thin') return 1;
      if (a.type !== 'thin' && b.type === 'thin') return -1;
      return 0;
    });

    const ringData: RingRenderData[] = sortedRings.map((ring) => {
      const isThin = ring.type === 'thin';
      const timeUnit = ring.timeUnit || disc.defaultTimeUnit;

      // Calculate position based on ring type
      let innerRadius, outerRadius;

      if (isThin) {
        // Position thin rings at the outer edge
        const thinRingIndex = thinRings.findIndex(r => r.id === ring.id);
        // Make sure thinRingIndex is valid (not -1)
        if (thinRingIndex === -1) {
          console.error(`Ring ${ring.id} not found in thinRings array`);
          // Use a default position if the ring is not found
          innerRadius = maxRadius - thinRingHeight;
          outerRadius = maxRadius;
        } else {
          innerRadius = maxRadius - ((thinRingIndex + 1) * thinRingHeight) - (thinRingIndex * ringPadding);
          outerRadius = innerRadius + thinRingHeight;
        }
      } else {
        // Position normal rings from the center outward
        const normalRingIndex = normalRings.findIndex(r => r.id === ring.id);
        // Make sure normalRingIndex is valid (not -1)
        if (normalRingIndex === -1) {
          console.error(`Ring ${ring.id} not found in normalRings array`);
          // Use a default position if the ring is not found
          innerRadius = centerRadius;
          outerRadius = centerRadius + normalRingHeight;
        } else {
          innerRadius = centerRadius + (normalRingIndex * (normalRingHeight + ringPadding));
          outerRadius = innerRadius + normalRingHeight;
        }
      }

      // Generate ticks for this ring based on its time unit
      const ticks = [];
      if (timeUnit === 'week' || timeUnit === 'day' || timeUnit === 'quarter') {
        const start = new Date(disc.start);
        const end = new Date(disc.end);
        const current = new Date(start);

        while (current <= end) {
          // For weeks, we want the start of each week
          // For days, every day
          // For quarters, every 3 months
          ticks.push({
            date: new Date(current),
            angle: dateToAngle(current.toISOString(), disc.start, disc.end)
          });

          if (timeUnit === 'week') {
            current.setDate(current.getDate() + 7);
          } else if (timeUnit === 'day') {
            current.setDate(current.getDate() + 1);
          } else if (timeUnit === 'quarter') {
            current.setMonth(current.getMonth() + 3);
          }
        }
      }

      // Filter activities based on filters
      const filteredActivities = (ring.activities || []).filter(activity => {
        // Filter by labelIds
        if (filters.labelIds.length > 0 && (!activity.labelIds || !activity.labelIds.some(id => filters.labelIds.includes(id)))) {
          return false;
        }

        // Filter by dateRange
        if (filters.dateRange && filters.dateRange.start && filters.dateRange.end) {
          const activityStart = new Date(activity.start);
          const activityEnd = activity.end ? new Date(activity.end) : activityStart;
          const filterStart = new Date(filters.dateRange.start);
          const filterEnd = new Date(filters.dateRange.end);

          // Check if activity date range overlaps with filter date range
          if (activityEnd < filterStart || activityStart > filterEnd) {
            return false;
          }
        }

        // Filter by textSearch
        if (filters.textSearch && !activity.title.toLowerCase().includes(filters.textSearch.toLowerCase())) {
          return false;
        }

        return true;
      });

      // First pass: calculate angles for all activities
      const activitiesWithAngles = filteredActivities.map(activity => {
        // Parse start and end as dates, fallback to disc start/end if missing
        const startDate = activity.start ? new Date(activity.start) : new Date(disc.start);
        const endDate = activity.end ? new Date(activity.end) : startDate;
        // Clamp endDate to disc.end if it exceeds
        const discEndDate = new Date(disc.end);
        const clampedEndDate = endDate > discEndDate ? discEndDate : endDate;
        const startAngle = dateToAngle(startDate.toISOString(), disc.start, disc.end);
        const endAngle = dateToAngle(clampedEndDate.toISOString(), disc.start, disc.end);

        return {
          activity,
          startAngle,
          endAngle: Math.max(endAngle, startAngle + 0.03), // Ensure minimum visible arc
          startDate,
          endDate: clampedEndDate
        };
      });

      // Second pass: detect overlaps and create activity render data
      const activities: ActivityRenderData[] = activitiesWithAngles.map((item, idx) => {
        // Find overlapping activities
        const overlaps = activitiesWithAngles.filter((other, otherIdx) => {
          if (idx === otherIdx) return false; // Skip self

          // Check if activities overlap in time
          return (
            (item.startDate <= other.endDate && item.endDate >= other.startDate) ||
            (other.startDate <= item.endDate && other.endDate >= item.startDate)
          );
        });

        // Adjust radius based on overlaps
        let adjustedInnerRadius = innerRadius;
        let adjustedOuterRadius = outerRadius;

        if (overlaps.length > 0) {
          // Create a sorted list of all overlapping activities including the current one
          const allOverlappingActivities = [...overlaps, item].sort((a, b) => 
            a.activity.id.localeCompare(b.activity.id)
          );

          // Find position of current activity in the sorted list
          const position = allOverlappingActivities.findIndex(a => a.activity.id === item.activity.id);

          // Total overlapping activities
          const totalOverlapping = allOverlappingActivities.length;

          // Divide the ring thickness by the number of overlapping activities
          const segmentHeight = (outerRadius - innerRadius) / totalOverlapping;

          // Adjust inner and outer radius based on position
          adjustedInnerRadius = innerRadius + (position * segmentHeight);
          adjustedOuterRadius = adjustedInnerRadius + segmentHeight;
        }

        return {
          ...item.activity,
          arcSegment: {
            startAngle: item.startAngle,
            endAngle: item.endAngle,
            innerRadius: adjustedInnerRadius,
            outerRadius: adjustedOuterRadius
          },
          isVisible: true,
          isSelected: selectedActivityId === item.activity.id
        };
      }) || []

      return {
        ...ring,
        innerRadius,
        outerRadius,
        activities,
        ticks
      }
    })

    // Generate time ticks for the outer ring based on disc start date
    const startDate = new Date(disc.start);
    const endDate = new Date(disc.end);
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();

    // Calculate the number of months between start and end dates
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    
    let ticks: { date: Date; angle: number; label: string; isCurrent: boolean }[] = [];
    const today = new Date();

    if (totalDays <= 32) {
      // Monthly disc: show days
      const current = new Date(startDate);
      while (current <= endDate) {
        ticks.push({
          date: new Date(current),
          angle: dateToAngle(current.toISOString(), disc.start, disc.end),
          label: current.getDate().toString(),
          isCurrent: current.getFullYear() === today.getFullYear() && 
                    current.getMonth() === today.getMonth() && 
                    current.getDate() === today.getDate()
        });
        current.setDate(current.getDate() + 1);
      }
    } else if (totalDays <= 100) {
      // Quarterly disc: show weeks or semi-months
      const current = new Date(startDate);
      while (current <= endDate) {
        ticks.push({
          date: new Date(current),
          angle: dateToAngle(current.toISOString(), disc.start, disc.end),
          label: current.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
          isCurrent: current.getFullYear() === today.getFullYear() && 
                    current.getMonth() === today.getMonth() && 
                    (today.getTime() - current.getTime()) < (7 * 24 * 60 * 60 * 1000) &&
                    (today.getTime() - current.getTime()) >= 0
        });
        current.setDate(current.getDate() + 7); // Weekly ticks
      }
    } else {
      // Yearly disc: show months
      const monthDiff = (endDate.getFullYear() - startYear) * 12 + endDate.getMonth() - startMonth + 1;
      const numMonths = Math.min(12, monthDiff);

      for (let i = 0; i < numMonths; i++) {
        const monthDate = new Date(startYear, startMonth + i, 1);
        ticks.push({
          date: monthDate,
          angle: dateToAngle(monthDate.toISOString(), disc.start, disc.end),
          label: monthDate.toLocaleString('default', { month: 'short' }),
          isCurrent: monthDate.getFullYear() === today.getFullYear() && monthDate.getMonth() === today.getMonth()
        });
      }
    }

    const timeTicks = ticks;

    return { centerRadius, maxRadius, ringData, timeTicks }
  }, [disc, selectedActivityId, filters])



  // Function to create SVG path for arc segments
  const createArcPath = ({ startAngle, endAngle, innerRadius, outerRadius }: ActivityRenderData['arcSegment']) => {
    const start = polarToCartesian(startAngle, innerRadius);
    const end = polarToCartesian(endAngle, innerRadius);
    const outerStart = polarToCartesian(startAngle, outerRadius);
    const outerEnd = polarToCartesian(endAngle, outerRadius);

    return `M ${start.x} ${start.y} A ${innerRadius} ${innerRadius} 0 0 1 ${end.x} ${end.y} L ${outerEnd.x} ${outerEnd.y} A ${outerRadius} ${outerRadius} 0 0 0 ${outerStart.x} ${outerStart.y} Z`;
  };

  // Function to create top border path (outer arc)
  const createTopBorderPath = ({ startAngle, endAngle, outerRadius }: ActivityRenderData['arcSegment']) => {
    const outerStart = polarToCartesian(startAngle, outerRadius);
    const outerEnd = polarToCartesian(endAngle, outerRadius);

    return `M ${outerEnd.x} ${outerEnd.y} A ${outerRadius} ${outerRadius} 0 0 0 ${outerStart.x} ${outerStart.y}`;
  };


  return (
    <div className="w-full h-full flex items-center justify-center relative" style={{ width: 800, height: 800 }}>
        <svg
          width="800"
          height="800"
          viewBox="0 0 800 800"
          className="block mx-auto"
          style={{ display: 'block', margin: '0 auto', background: 'none', position: 'relative', left: 0, top: 0 }}
        >
          <g transform="translate(400,400)">
            {/* Outer time ring with month/day divisions - label centered in arc */}
            {timeTicks.map(({ angle, label, isCurrent }, index) => {
              // Center the label in the middle of the arc segment
              let nextAngle = angle;
              if (index < timeTicks.length - 1) {
                nextAngle = timeTicks[index + 1].angle;
              } else if (timeTicks.length > 1) {
                const avgDelta = (timeTicks[timeTicks.length - 1].angle - timeTicks[0].angle) / (timeTicks.length - 1);
                nextAngle = angle + avgDelta;
              }
              const middleAngle = (angle + nextAngle) / 2;
              // Keep lines inside the disc, remove outside tick marks
              return (
                <g key={index}>
                  {/* Line from center to tick (inside disc only) */}
                  <line
                    x1={0}
                    y1={0}
                    x2={polarToCartesian(angle, maxRadius).x}
                    y2={polarToCartesian(angle, maxRadius).y}
                    stroke={isCurrent ? '#ef4444' : '#9ca3af'}
                    strokeWidth={isCurrent ? '2' : '1'}
                    strokeDasharray="2,2"
                    className={isCurrent ? '' : 'dark:stroke-gray-500'}
                  />
                  {/* Centered label, closer to disc */}
                  <text
                    x={polarToCartesian(middleAngle, maxRadius + 20).x}
                    y={polarToCartesian(middleAngle, maxRadius + 20).y}
                    textAnchor="middle"
                    className={isCurrent ? 'text-xs font-bold fill-red-600' : 'text-xs font-medium fill-gray-600 dark:fill-gray-400'}
                  >
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Ring backgrounds with proper styling */}
            {[...ringData].reverse().map((ring) => {
              // Calculate label arc just outside the ring
              const labelRadius = ring.outerRadius + 6;
              // Arc for the label: from -60deg to +60deg (centered at bottom, curve downward, text upright)
              const labelStartAngle = Math.PI / 2 + Math.PI / 6; // 120deg
              const labelEndAngle = Math.PI / 2 - Math.PI / 6;   // 60deg
              // Path for the label
              const labelArcPath = (() => {
                const start = polarToCartesian(labelStartAngle, labelRadius);
                const end = polarToCartesian(labelEndAngle, labelRadius);
                // Use sweep-flag=0 to keep text upright
                return `M ${start.x} ${start.y} A ${labelRadius} ${labelRadius} 0 0 0 ${end.x} ${end.y}`;
              })();
              return (
                <g key={ring.id}>
                  {/* Ring background with subtle fill */}
                  {ring.type === 'thin' ? (
                    // Thin ring with donut appearance
                    <>
                      {/* Shadow filter for donut */}
                      <defs>
                        <filter id={`shadow-${ring.id}`} x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                          <feOffset dx="0" dy="0" result="offsetblur" />
                          <feComponentTransfer>
                            <feFuncA type="linear" slope="0.2" />
                          </feComponentTransfer>
                          <feMerge>
                            <feMergeNode />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* Donut shape with path */}
                      <path
                        d={`
                          M 0 ${-ring.outerRadius}
                          A ${ring.outerRadius} ${ring.outerRadius} 0 0 1 0 ${ring.outerRadius}
                          A ${ring.outerRadius} ${ring.outerRadius} 0 0 1 0 ${-ring.outerRadius}
                          Z
                          M 0 ${-ring.innerRadius}
                          A ${ring.innerRadius} ${ring.innerRadius} 0 0 0 0 ${ring.innerRadius}
                          A ${ring.innerRadius} ${ring.innerRadius} 0 0 0 0 ${-ring.innerRadius}
                          Z
                        `}
                        fill={ring.color ? `${ring.color}20` : '#f8fafc'}
                        filter={`url(#shadow-${ring.id})`}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        stroke={ring.color || '#3b82f6'}
                        strokeWidth={0.5}
                        onClick={e => {
                          if (e.target === e.currentTarget) {
                            openActivityDrawer(undefined);
                          }
                        }}
                      />
                      {/* Outer border with ring color */}
                      <circle
                        cx={0}
                        cy={0}
                        r={ring.outerRadius}
                        fill="none"
                        stroke={ring.color || '#3b82f6'}
                        strokeWidth={2}
                        className="pointer-events-none opacity-30"
                      />
                      {/* Inner border with different color */}
                      <circle
                        cx={0}
                        cy={0}
                        r={ring.innerRadius}
                        fill="none"
                        stroke={ring.color ? `${ring.color}60` : '#cbd5e1'}
                        strokeWidth={2}
                        className="pointer-events-none opacity-30"
                      />
                    </>
                  ) : (
                    // Normal ring
                    <circle
                      cx={0}
                      cy={0}
                      r={ring.outerRadius}
                      fill={ring.color ? `${ring.color}10` : '#f8fafc'}
                      stroke={ring.color || '#e2e8f0'}
                      strokeWidth={2}
                      className="cursor-pointer hover:opacity-80 transition-opacity opacity-50"
                      onClick={e => {
                        // Only open create if the click is not on an activity arc
                        // If the click is directly on the circle, open new activity
                        if (e.target === e.currentTarget) {
                          openActivityDrawer(undefined);
                        }
                      }}
                    />
                  )}
                  {/* Sub-month divisions (weeks/days) */}
                  {ring.ticks && ring.ticks.map((tick, i) => (
                    <line
                      key={`tick-${ring.id}-${i}`}
                      x1={polarToCartesian(tick.angle, ring.innerRadius).x}
                      y1={polarToCartesian(tick.angle, ring.innerRadius).y}
                      x2={polarToCartesian(tick.angle, ring.outerRadius).x}
                      y2={polarToCartesian(tick.angle, ring.outerRadius).y}
                      stroke={ring.color || '#9ca3af'}
                      strokeWidth="1"
                      strokeOpacity="0.3"
                      className="pointer-events-none"
                    />
                  ))}
                  {/* Curved ring name just below the ring, curve downward, text upright - only for normal rings - REMOVED */}
                  {false && ring.type !== 'thin' && (
                    <>
                      <path
                        id={`ring-label-arc-${ring.id}`}
                        d={labelArcPath}
                        fill="none"
                        stroke="none"
                      />
                      <text
                        fontSize="10"
                        className="font-bold text-gray-700 dark:fill-white"
                        textAnchor="middle"
                        dominantBaseline="hanging"
                        style={{ whiteSpace: 'nowrap', pointerEvents: 'none' }}
                      >
                        <textPath
                          href={`#ring-label-arc-${ring.id}`}
                          startOffset="50%"
                          alignmentBaseline="hanging"
                          dominantBaseline="hanging"
                        >
                          {ring.name.length > 20 ? ring.name.substring(0, 20) + '...' : ring.name}
                        </textPath>
                      </text>
                    </>
                  )}
                  {/* Activities as SVG arc paths */}
                  {ring.activities.map((activity) => {
                    const arc = activity.arcSegment;

                    // Calculate the middle angle for text placement
                    const middleAngle = (arc.startAngle + arc.endAngle) / 2;
                    const middleRadius = (arc.innerRadius + arc.outerRadius) / 2;

                    // Determine if text should be flipped based on angle
                    const textAngle = (middleAngle * 180 / Math.PI) % 360;
                    const flipText = textAngle > 90 && textAngle < 270;

                    // Create a unique ID for the text path
                    const textPathId = `text-path-${activity.id}`;

                    // Calculate arc length to determine if there's enough space for text
                    const arcLength = Math.abs(arc.endAngle - arc.startAngle) * middleRadius;
                    const ringThickness = arc.outerRadius - arc.innerRadius;

                    // Calculate activity duration in days
                    const startDate = new Date(activity.start);
                    const endDate = activity.end ? new Date(activity.end) : startDate;
                    const durationMs = endDate.getTime() - startDate.getTime();
                    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

                    // Calculate the distance from the center of the SVG
                    const distanceFromCenter = Math.sqrt(
                      Math.pow(polarToCartesian(middleAngle, middleRadius).x, 2) + 
                      Math.pow(polarToCartesian(middleAngle, middleRadius).y, 2)
                    );

                    // Calculate the maximum available space for text
                    // The closer to the edge, the less space is available
                    const svgRadius = 400; // SVG is 800x800 with center at 400,400
                    const distanceToEdge = svgRadius - distanceFromCenter;
                    const edgeFactor = Math.min(1, distanceToEdge / 100); // Reduce text length as we approach edge

                    // Determine text display mode based on available space
                    const showText = arcLength > 15; // Minimum space needed for any text (reduced from 20)
                    const useVerticalText = (arcLength <= 30 && ringThickness >= 20) || durationDays < 16; // Use vertical text when arc is small but ring is thick enough, or duration is less than 16 days

                    // Adjust title length based on available space and distance to edge
                    const maxTitleLength = Math.floor(20 * edgeFactor);
                    const truncatedTitle = activity.title.length > maxTitleLength && maxTitleLength > 3 
                      ? activity.title.substring(0, maxTitleLength - 3) + '...' 
                      : activity.title;

                    return (
                      <g key={activity.id}>
                        <g>
                          {/* Main activity fill */}
                          <path
                            d={createArcPath(arc)}
                            fill={activity.color || ring.color || '#3b82f6'} 
                            stroke="none"
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={e => {
                              e.stopPropagation();
                              openActivityDrawer(String(activity.id)); // Always pass string id for edit
                            }}
                          />
                          {/* Top border with ring color only if activity touches the ring border */}
                          <path
                            d={createTopBorderPath(arc)}
                            fill="none"
                            stroke={arc.outerRadius === ring.outerRadius ? (ring.color || '#3b82f6') : (activity.color || ring.color || '#3b82f6')}
                            strokeWidth="2"
                            className="pointer-events-none"
                          />
                        </g>

                        {/* Activity title - only for normal rings */}
                        {ring.type !== 'thin' && showText && !useVerticalText && maxTitleLength > 3 && (
                          <>
                            {/* Create a curved path for the text to follow */}
                            <path
                              id={textPathId}
                              d={`M ${polarToCartesian(arc.startAngle, middleRadius).x} ${polarToCartesian(arc.startAngle, middleRadius).y} 
                                 A ${middleRadius} ${middleRadius} 0 0 1 ${polarToCartesian(arc.endAngle, middleRadius).x} ${polarToCartesian(arc.endAngle, middleRadius).y}`}
                              fill="none"
                              stroke="none"
                            />

                            <text
                              dy={flipText ? -2 : 4}
                              fill="#fff"
                              fontSize="10"
                              fontWeight="bold"
                              textAnchor="middle"
                              style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                            >
                              <textPath
                                href={`#${textPathId}`}
                                startOffset="50%"
                                style={{ 
                                  dominantBaseline: flipText ? 'hanging' : 'middle'
                                }}
                              >
                                {truncatedTitle}
                              </textPath>
                            </text>
                          </>
                        )}

                        {/* Vertical text for small arcs - only for normal rings */}
                        {ring.type !== 'thin' && showText && useVerticalText && maxTitleLength > 3 && (
                          <text
                            x={polarToCartesian(middleAngle, middleRadius).x}
                            y={polarToCartesian(middleAngle, middleRadius).y}
                            fill="#fff"
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            transform={`rotate(${(middleAngle * 180 / Math.PI) + (textAngle > 90 && textAngle < 270 ? 180 : 0)}, ${polarToCartesian(middleAngle, middleRadius).x}, ${polarToCartesian(middleAngle, middleRadius).y})`}
                            style={{ pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                          >
                            {truncatedTitle}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Center circle with disc info */}
            <circle
              cx={0}
              cy={0}
              r={centerRadius}
              fill="#1f2937"
              stroke="#374151"
              strokeWidth="2"
              style={{ cursor: 'pointer' }}
              onClick={() => setIsEditDiscOpen(true)}
            />
            {/* Center text */}
            <text
              x={0}
              y={-5}
              textAnchor="middle"
              className="text-sm font-bold fill-white"
              style={{ fontSize: '12px', pointerEvents: 'none' }}
            >
              {disc.name}
            </text>
            <text
              x={0}
              y={15}
              textAnchor="middle"
              className="text-xs fill-gray-300"
              style={{ fontSize: '10px', pointerEvents: 'none' }}
            >
              {(() => {
                const startYear = new Date(disc.start).getFullYear();
                const endYear = new Date(disc.end).getFullYear();
                return startYear === endYear 
                  ? startYear.toString() 
                  : `${startYear}/${endYear.toString().slice(-2)}`;
              })()}
            </text>
            {/* Edit Disc Modal (with name editing) */}
            {isEditDiscOpen && (
              <foreignObject x={-150} y={-100} width={300} height={200}>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 flex flex-col items-center border border-gray-100 dark:border-gray-700">
                  <div className="font-bold text-gray-900 dark:text-white mb-3">Edit Disc</div>
                  <input
                    type="text"
                    value={editDiscName}
                    onChange={e => setEditDiscName(e.target.value)}
                    className="input mb-4"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setIsEditDiscOpen(false)}
                      className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (editDiscName.trim()) {
                          saveDisc({ ...disc, name: editDiscName.trim() });
                          setIsEditDiscOpen(false);
                        }
                      }}
                      className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </foreignObject>
            )}
          </g>
        </svg>
      </div>
  )
}
