import "mapbox-gl/src/css/mapbox-gl.css";
import "bulma/css/bulma.css";
import "bulma-pageloader/dist/css/bulma-pageloader.min.css";
import "./style.css";

import { CarDriverInitialLocation } from "./car-driver/car-driver-initial-location";
import { latlon } from "sgeo";
import { GameView } from "./view/game-view";
import { OsmDataProvider } from "./osm-data/osm-data-provider";
import { GameViewController } from "./view/game-view-controller";
import { CarDriver } from "./car-driver/car-driver";

//constructor(public location: latlon, public osmNodeID: number, public osmWayID: number, public direction: boolean, public bearing: number) { }
const initialLocation = new CarDriverInitialLocation(new latlon(48.7224016, -3.4260109), 3682192163, 364145218, true, 0);
const mapboxAccessToken = "pk.XXX.XXX"; // see README
const mapboxStyle = "mapbox://styles/mapbox/streets-v11";

const view = new GameView(mapboxAccessToken, mapboxStyle);
const osmDataProvider = new OsmDataProvider();
const carDriver = new CarDriver(osmDataProvider, initialLocation);
const controller = new GameViewController(view, osmDataProvider, carDriver);