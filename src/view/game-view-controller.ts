import { GameView } from "./game-view";
import { CarDriver, CarDriverStateCode } from "../car-driver/car-driver";
import { OsmDataProvider } from "../osm-data/osm-data-provider";
import { CharacterMarkerBuilder } from "./character-marker-builder";

import transformTranslate from "@turf/transform-translate";
import { point } from "@turf/helpers";
import { OsmTile } from "../osm-data/osm-tile";

const CAR_MIN_SPEED = 0;
const CAR_MAX_SPEED = 4;

export class GameViewController {

    private _view: GameView;
    private _carDriver: CarDriver;
    private _osmDataProvider: OsmDataProvider;

    constructor(view: GameView, osmDataProvider: OsmDataProvider, carDriver: CarDriver) {
        this._view = view;
        this._osmDataProvider = osmDataProvider;
        this._carDriver = carDriver;

        this._view.onMapRendered.sub(this._onMapRendered);
        this._view.onKeyDown.sub(this._onKeyDown);
        this._view.onMapTileLoad.sub(this._onMapTileLoad);

        this._carDriver.onStateChanged.sub((state)=>{
            this._view.setLeftIndicatorActive(state.leftTurnIndicatorActive);
            this._view.setRightIndicatorActive(state.rightTurnIndicatorActive);
        });

        this._carDriver.onStateCodeChanged.sub((code)=>{
            const loading = (code === CarDriverStateCode.Initializing || code === CarDriverStateCode.LoadingTile)
            this._view.setLoadingSpinnerActive(loading);

            if (code === CarDriverStateCode.Error){
                alert("Error. Check your internet connection and refresh this page");
            }
        })
    }

    private _onMapTileLoad = (tile: OsmTile) => {
        this._osmDataProvider.loadDataForTile(tile);
    }

    private _onMapRendered = () => {
        const { latlon, bearing, multipleChoices } = this._carDriver.state;
        this._view.setMapCenter([latlon.lng, latlon.lat]);
        this._view.setMapBearing(bearing);

        for (const markerID of this._view.markers.keys()) {
            if (markerID.startsWith("choice-")) {
                this._view.removeMarker(markerID);
            }
        }

        if (multipleChoices.length > 0) {
            for (let i = 0; i < multipleChoices.length; i++) {
                const markerPoint = transformTranslate(point([latlon.lng, latlon.lat]),
                    15,
                    multipleChoices[i].bearing, {
                        units: "meters",
                        mutate: true
                    });
                const marker = new CharacterMarkerBuilder(markerPoint.geometry.coordinates as [number, number], `${i + 1}`)
                    .setBackgroundColor("blue").setTextColor("white").build();

                this._view.addMarker(`choice-${i + 1}`, marker);
            }
        }
    }

    private _onKeyDown = (key: string) => {
        const { multipleChoices } = this._carDriver.state;
        if (this._carDriver.stateCode === CarDriverStateCode.WaitingForUserChoice && multipleChoices[Number(key) - 1]) {
            this._carDriver.onUserChoiceFromMultipleChoices(multipleChoices[Number(key) - 1]);
        }else if (key === "ArrowUp") {
            this._onUpBtnClick();
        } else if (key === "ArrowDown") {
            this._onDownBtnClick();
        } else if (key === "ArrowLeft") {
            this._onLeftBtnClick();
        } else if (key === "ArrowRight") {
            this._onRightBtnClick();
        }
    }

    private _onLeftBtnClick() {
        const { rightTurnIndicatorActive } = this._carDriver.state;
        if (rightTurnIndicatorActive) {
            this._carDriver.setState({ rightTurnIndicatorActive: false });
        } else {
            this._carDriver.setState({ leftTurnIndicatorActive: true });
        }
    }

    private _onRightBtnClick() {
        const { leftTurnIndicatorActive } = this._carDriver.state;
        if (leftTurnIndicatorActive) {
            this._carDriver.setState({ leftTurnIndicatorActive: false });
        } else {
            this._carDriver.setState({ rightTurnIndicatorActive: true });
        }
    }

    private _onUpBtnClick() {
        const { speed } = this._carDriver.state;
        this._carDriver.setState({ speed: Math.min(speed * 1.2, CAR_MAX_SPEED) });
    }

    private _onDownBtnClick() {
        const { speed } = this._carDriver.state;
        this._carDriver.setState({ speed: Math.max(speed * 0.8, CAR_MIN_SPEED) });
    }

}