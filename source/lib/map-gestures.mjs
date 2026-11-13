// The center may reach the edge so the map can move even at world zoom.
// Web Mercator world: 720 units wide, y from -180 to 540.
export const MAX_ZOOM=262144;
export function mapPoint(lat,lng){
 const phi=Math.max(-85.05112878,Math.min(85.05112878,lat))*Math.PI/180;
 return [(lng+180)*2,180-720*Math.log(Math.tan(Math.PI/4+phi/2))/(2*Math.PI)];
}
// Only request tiles intersecting the visible viewport, using the browser HTTP cache.
export function visibleTiles(zoom,center,width=720,height=360){
 const z=Math.max(0,Math.min(19,Math.ceil(Math.log2(zoom*Math.max(width,256)/256))));
 const count=2**z,size=720/count,halfHeight=360*height/Math.max(width,1)/zoom;
 const left=Math.max(0,Math.floor((center[0]-360/zoom)/size)),right=Math.min(count-1,Math.floor((center[0]+360/zoom)/size));
 const top=Math.max(0,Math.floor((center[1]-halfHeight+180)/size)),bottom=Math.min(count-1,Math.floor((center[1]+halfHeight+180)/size));
 const tiles=[];for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)tiles.push({z,x,y,left:x*size,top:y*size-180,size});
 return tiles;
}
export function clampView(zoom, center) {
 const z=Math.max(1,Math.min(MAX_ZOOM,zoom));
 return {zoom:z,center:[Math.max(0,Math.min(720,center[0])),Math.max(-180,Math.min(540,center[1]))]};
}
const midpoint=points=>points.length>1?[(points[0][0]+points[1][0])/2,(points[0][1]+points[1][1])/2]:points[0];
const span=points=>points.length>1?Math.hypot(points[1][0]-points[0][0],points[1][1]-points[0][1]):0;
export function gestureView(start, points) {
 const before=midpoint(start.points),after=midpoint(points);
 const initialSpan=span(start.points),currentSpan=span(points);
 const zoom=Math.max(1,Math.min(MAX_ZOOM,start.zoom*(initialSpan>0?currentSpan/initialSpan:1)));
 return clampView(zoom,[start.center[0]+before[0]/start.zoom-after[0]/zoom,start.center[1]+before[1]/start.zoom-after[1]/zoom]);
}
