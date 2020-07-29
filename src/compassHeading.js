import { calcCompassHeading } from './calcCompassHeading';

let _compassHeading = 0;
let _accuracy = -1000;

export function getCompassHeading() {
  return _compassHeading;
}

export function getCompassHeadingExtra() {
  return {
    heading: _compassHeading,
    accuracy: _accuracy,
  }
}

export function updateCompassHeading(eventData) {
  let compassdir = 0;

  // @ts-ignore
  if (eventData.webkitCompassHeading) {
    // Apple works only with this, alpha doesn't work
    // @ts-ignore
    compassdir = eventData.webkitCompassHeading;
    // @ts-ignore
    _accuracy = eventData.webkitCompassAccuracy;
  } else if (
    eventData.absolute === true &&
    eventData.alpha !== null &&
    eventData.beta !== null &&
    eventData.gamma !== null
  ) {
    compassdir = calcCompassHeading(
      eventData.alpha,
      eventData.beta,
      eventData.gamma
    );

    console.log(`[calc] h: ${compassdir}`);
  } else if (eventData.absolute && eventData.alpha !== null) {
    compassdir = eventData.alpha;
  } else {
    console.log(`[bad] h: ${compassdir}`);
  }

  _compassHeading = compassdir;
};

export function updateCompassHeadingAbsolute(eventData) {
  // TODO: do we need to deduct alpha from 360?  
  _compassHeading = eventData.alpha ? 360 - eventData.alpha : 0;
};
