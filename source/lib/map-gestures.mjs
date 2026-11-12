// Coordinates use the original 720 × 360 world map, centered on the viewport.
export function clampView(zoom, center) {
 const z=Math.max(1,Math.min(8,zoom));
 return {zoom:z,center:[Math.max(360/z,Math.min(720-360/z,center[0])),Math.max(180/z,Math.min(360-180/z,center[1]))]};
}
const midpoint=points=>points.length>1?[(points[0][0]+points[1][0])/2,(points[0][1]+points[1][1])/2]:points[0];
const span=points=>points.length>1?Math.hypot(points[1][0]-points[0][0],points[1][1]-points[0][1]):0;
export function gestureView(start, points) {
 const before=midpoint(start.points),after=midpoint(points);
 const initialSpan=span(start.points),currentSpan=span(points);
 const zoom=Math.max(1,Math.min(8,start.zoom*(initialSpan>0?currentSpan/initialSpan:1)));
 return clampView(zoom,[start.center[0]+before[0]/start.zoom-after[0]/zoom,start.center[1]+before[1]/start.zoom-after[1]/zoom]);
}
