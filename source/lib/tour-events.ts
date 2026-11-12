import events from '../public/events.json';
export const tourEvents=events;
export function validEvent(value:unknown){return typeof value==='number'&&Number.isInteger(value)&&events.some(e=>e.id===value)}
