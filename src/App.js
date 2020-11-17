// import './threeModules';
import "./photo-sphere-viewer.css";
import React from "react";
import styled, { createGlobalStyle } from "styled-components";
import {
  isIOS,
  isMobileSafari,
  isSafari,
  isIPad13,
  isMobile,
} from "react-device-detect";
import * as PhotoSphereViewer from "photo-sphere-viewer";
import GyroscopePlugin from "photo-sphere-viewer/dist/plugins/gyroscope";
import eruda from "eruda";
import panorama from "./assets/f4399f2b0b4bd8ba8406908b798add0b.jpg";
import { OrientationListener } from "./OrientationListener";
import { getCompassHeadingExtra } from "./compassHeading";

eruda.init({
  tool: ["console", "elements"],
  useShadowDom: true,
  autoScale: true,
  defaults: {
    displaySize: 50,
    transparency: 0.9,
    theme: "Monokai Pro",
  },
});

const defaultPanoOptions = {
  autorotateDelay: false,
  autorotateSpeed: "60dpm",
  autorotateLat: 0,
  navbar: false,
  minFov: 1,
  maxFov: 179,
};

class App extends React.Component {
  photoSphereViewer = null;

  componentDidMount() {
    this.initPhotoSphere();
  }

  initPhotoSphere = () => {
    const options = {
      ...defaultPanoOptions,
      container: document.querySelector("#photosphere"),
      panorama,
      defaultZoomLvl: 80,
      defaultLat: 0,
      defaultLong: 0,
      size: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      navbar: ["autorotate"],
      plugins: [GyroscopePlugin],
    };

    this.photoSphereViewer = new PhotoSphereViewer.Viewer(options);

    this.photoSphereViewer.on("ready", () => {
      window.addEventListener("resize", this.onResize, false);
    });
  };

  onResize = () => {
    // const photoSphereElem = document.querySelector("#photosphere");

    // if (!photoSphereElem) {
    //   return;
    // }

    // // not directly supported :/
    // // https://github.com/mistic100/Photo-Sphere-Viewer/issues/244
    // // @ts-ignore
    // photoSphereElem.style.width = `100%`;
    // // @ts-ignore
    // photoSphereElem.style.height = `100%`;

    // this.photoSphereViewer.resize({
    //   width: "100%",
    //   height: "100%",
    // });

    if (this.photoSphereViewer) {
      this.photoSphereViewer.autoSize();
    }
  };

  toggleGyroscopeControl = () => {
    if (!this.photoSphereViewer) {
      return;
    }

    const plugin = this.photoSphereViewer.getPlugin(GyroscopePlugin);

    if (plugin && typeof plugin.isEnabled !== "function") {
      console.log("plugin issue");
    }

    if (plugin.isEnabled()) {
      plugin.stop();
    } else {
      plugin
        .start()
        .then(() => {
          const { latitude } = this.photoSphereViewer.getPosition();
          const { heading } = getCompassHeadingExtra();

          this.photoSphereViewer.rotate({
            longitude: degreesToRadians(heading),
            latitude,
          });
        })
        .catch(this.handleGyroEnableError);
    }
  };

  handleGyroEnableError = () => {
    if ((isIOS && isMobileSafari) || (isIPad13 && isSafari)) {
      if (
        // @ts-ignore
        window.DeviceOrientationEvent !== undefined &&
        // @ts-ignore
        typeof window.DeviceOrientationEvent.requestPermission === "function"
      ) {
        // @ts-ignore
        window.DeviceOrientationEvent.requestPermission().then((response) => {
          if (response !== "granted") {
            this.showGyroErrorAlert(
              "Gyroscope permissions have been denied. Please clear the website data from Settings -> Safari -> Advanced -> Website Data, then make sure to refresh the page and tap the Gyroscope icon."
            );
          } else {
            window.location.reload();
          }
        });
      } else {
        this.showGyroErrorAlert(
          "Please enable Motion & Orientation Access from Settings -> Safari, then make sure to refresh the page and tap the Gyroscope icon."
        );
      }
    } else {
      this.showGyroErrorAlert("The Gyroscope is not supported on this device.");
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

      // window.removeEventListener('resize', this.onResize);
    }
  };

  componentWillUnmount(): void {
    this.cleanup();
  }

  updateFOV = (e) => {
    if (!this.photoSphereViewer) {
      return;
    }

    const fovStr = e.target.value;

    try {
      const fov = parseFloat(fovStr);

      console.log("fov:", fov);

      if (fov < 1 || fov > 179) {
        window.alert("set between 1 and 179");
        return;
      }

      const { minFov, maxFov } = defaultPanoOptions;

      const zoom = ((maxFov - fov) * 100) / (maxFov - minFov);

      console.log("zoom:", zoom);

      this.photoSphereViewer.zoom(zoom);
    } catch (error) {}
  };

  render() {
    return (
      <>
        <GlobalStylesPanorama />

        <RendererContainer id="photosphere" />

        <Buttons>
          <Button
            onClick={() => {
              if (this.photoSphereViewer) {
                const { latitude } = this.photoSphereViewer.getPosition();
                const { heading } = getCompassHeadingExtra();

                this.photoSphereViewer.rotate({
                  longitude: degreesToRadians(heading),
                  latitude,
                });
              }
            }}
          >
            Calibrate with Compasss
          </Button>

          <Button
            onClick={() => {
              if (this.photoSphereViewer) {
                this.toggleGyroscopeControl();
              }
            }}
          >
            Toggle Gyro
          </Button>
        </Buttons>

        <FOVChangerContainer>
          <p>Set FOV (degrees)</p>
          <input type="number" onChange={this.updateFOV} min={1} max={179} />
        </FOVChangerContainer>

        {isMobile && <OrientationListener />}
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
  top: 30px;
  left: 30px;
  display: grid;
  grid-gap: 8px;
`;

const FOVChangerContainer = styled.div`
  position: fixed;
  z-index: 2;
  top: 150px;
  left: 30px;
  display: grid;
  grid-gap: 8px;
`;

const Button = styled.button`
  padding: 20px;
`;
