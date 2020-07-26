import './threeModules';
import './photo-sphere-viewer.css';
import React from 'react';
import styled, { createGlobalStyle } from 'styled-components'; 
import { isIOS, isMobileSafari, isSafari, isIPad13 } from 'react-device-detect';
import * as PhotoSphereViewer from 'photo-sphere-viewer';
import panorama from './assets/f4399f2b0b4bd8ba8406908b798add0b.jpg';

const defaultPanoOptions = {
  time_anim: false,
  anim_speed: '60dpm',
  anim_lat: 0,
  navbar: false,
  min_fov: 40,
  max_fov: 80,
};

class App extends React.Component {
  state = {
    gyroEnabled: false,
  }

  photoSphereViewer = null;

  componentDidMount() {
    this.initPhotoSphere();
  }

  initPhotoSphere = () => {
    const options = {
      ...defaultPanoOptions,
      container: "photosphere",
      panorama,
      default_fov: 60,
      default_lat: 0,
      default_long: 90,
      size: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };

    this.photoSphereViewer = new PhotoSphereViewer(options);

    this.photoSphereViewer.on('ready', () => {
      window.addEventListener('resize', this.onResize, false);
    });

    this.photoSphereViewer.on('gyroscope-updated', (enabled: any) => {
      this.setState({ gyroEnabled: enabled });
    });

  };

  onResize = () => {
    const photoSphereElem = document.querySelector('#photosphere');

    if (!photoSphereElem) {
      return;
    }

    // not directly supported :/
    // https://github.com/mistic100/Photo-Sphere-Viewer/issues/244
    // @ts-ignore
    photoSphereElem.style.width = `100%`;
    // @ts-ignore
    photoSphereElem.style.height = `100%`;

    this.photoSphereViewer.resize({
      width: '100%',
      height: '100%',
    });

    this.photoSphereViewer._onResize();
  };

  setGyroscopeControl = (enable: boolean) => {
    if (this.photoSphereViewer) {
      if (enable) {
        this.photoSphereViewer.startGyroscopeControl().catch(() => {
          if ((isIOS && isMobileSafari) || (isIPad13 && isSafari)) {
            if (
              // @ts-ignore
              window.DeviceOrientationEvent !== undefined &&
              // @ts-ignore
              typeof window.DeviceOrientationEvent.requestPermission ===
                'function'
            ) {
              // @ts-ignore
              window.DeviceOrientationEvent.requestPermission().then(
                (response) => {
                  if (response !== 'granted') {
                    this.showGyroErrorAlert(
                      'Gyroscope permissions have been denied. Please clear the website data from Settings -> Safari -> Advanced -> Website Data, then make sure to refresh the page and tap the Gyroscope icon.'
                    );
                  } else {
                    window.location.reload();
                  }
                }
              );
            } else {
              this.showGyroErrorAlert(
                'Please enable Motion & Orientation Access from Settings -> Safari, then make sure to refresh the page and tap the Gyroscope icon.'
              );
            }
          } else {
            this.showGyroErrorAlert('The Gyroscope is not supported on this device.');
          }
        });
      } else {
        // this runs without errors even if gyro is unavailable, so no need to catch it
        this.photoSphereViewer.stopGyroscopeControl();
      }
    }
  };

  showGyroErrorAlert = (message: string) => {
    window.alert(message);
  };

  cleanup = () => {
    if (this.photoSphereViewer) {
      // TODO: Firefox has an issue, so wrapping in a try catch block.
      try {        
        if (this.state.gyroEnabled) {
          this.photoSphereViewer.stopGyroscopeControl();
        }
      } catch (error) {
        // do nothing
      }

      try {
        this.photoSphereViewer.destroy();
      } catch (error) {
        // do nothing
      }

      window.removeEventListener('resize', this.onResize);
    }
  };

  componentWillUnmount(): void {
    this.cleanup();
  }

  render() {
    return (
      <>
        <GlobalStylesPanorama />

        <RendererContainer id="photosphere" />

        <Buttons>
          <Button
            onClick={() => {
              if (this.photoSphereViewer) {
                this.photoSphereViewer.rotate({
                  longitude:
                    this.photoSphereViewer.getPosition().longitude +
                    degreesToRadians(90),
                  latitude: this.photoSphereViewer.getPosition().latitude,
                });
              }
            }}
          >
            Rotate Camera by 90 Deg Clockwise
          </Button>

          <Button
            onClick={() => {
              if (this.photoSphereViewer) {
                this.setGyroscopeControl(!this.state.gyroEnabled)
              }
            }}
          >
            Toggle Gyro
          </Button>
        </Buttons>
      </>
    );
  }
}

export default App;

function degreesToRadians(degrees: number) {
  return degrees * (Math.PI / 180);
}

const GlobalStylesPanorama = createGlobalStyle`
  #photosphere {
    z-index: 1;
  }
 
  * {
    user-select: none;
  }
  
  html, body {
    overflow: hidden;
    background-color: #000;
  }
`;

const RendererContainer = styled.div`
  padding: 0;
  margin: 0;
  cursor: grab;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;


const Buttons = styled.div`
  position: fixed;
  z-index: 2;
  bottom: 30px;
  right: 30px;
  display: grid;
  grid-gap: 8px;  
`;

const Button =  styled.button`
  padding: 15px;
`;
