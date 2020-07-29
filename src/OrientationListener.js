import React from 'react';
import {
  updateCompassHeading,
  updateCompassHeadingAbsolute,
} from './compassHeading';

export class OrientationListener extends React.Component {
  state = {
    listeningAbs: false,
    listeningNormal: false,
  };

  componentDidMount() {
    console.log('orientationm listening');

    if ('ondeviceorientationabsolute' in window) {
      console.log('listening to ondeviceorientationabsolute');

      // We can listen for the new deviceorientationabsolute event.
      // @ts-ignore
      window.addEventListener(
        'deviceorientationabsolute',
        updateCompassHeadingAbsolute,
        true
      );

      this.setState({ listeningAbs: true });
    } else if ('ondeviceorientation' in window) {
      console.log('listening to ondeviceorientation');

      // We can still listen for deviceorientation events.
      // The `absolute` property of the event tells us whether
      // or not the degrees are absolute.
      window.addEventListener('deviceorientation', updateCompassHeading);

      this.setState({ listeningNormal: true });
    } else {
      console.log('did not find the events');
    }
  }

  componentWillUnmount() {
    if (this.state.listeningAbs) {
      window.removeEventListener(
        'deviceorientationabsolute',
        updateCompassHeadingAbsolute
      );
    } else if (this.state.listeningNormal) {
      window.removeEventListener('deviceorientation', updateCompassHeading);
    }
  }

  render() {
    return null;
  }
}
