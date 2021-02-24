
import { latlon } from "sgeo";
import { pointToTile } from "@mapbox/tilebelt";
import { OsmLocation } from "../osm-data/osm-location";
import { CarDriverMovement } from "./car-driver-movement";
import { OsmDataProvider } from "../osm-data/osm-data-provider";
import { CarDriverInitialLocation } from "./car-driver-initial-location";
import { OsmTile } from "../osm-data/osm-tile";
import { OsmAvailableDirectionsProvider } from "../osm-data/osm-available-directions-provider";
import { OneWayType } from "../osm-data/osm-way";
import { SimpleEventDispatcher } from "ste-simple-events";

export enum CarDriverStateCode {
    Stopped, Initializing, Running, Error, LoadingTile, WaitingForUserChoice
}

export interface CarDriverState {
    speed: number;
    leftTurnIndicatorActive: boolean;
    rightTurnIndicatorActive: boolean;
    latlon: latlon;
    bearing: number;
    osmLocation: OsmLocation;
    multipleChoices: OsmLocation[];
    currentMovement: CarDriverMovement;
    lastNoOneWayLocation: OsmLocation | undefined
}

//TODO Find better solution
const MAP_ZOOM = 18.5;

export class CarDriver {

    private _onStateChanged = new SimpleEventDispatcher<CarDriverState>();
    private _onStateCodeChanged = new SimpleEventDispatcher<CarDriverStateCode>();
    private _state: CarDriverState;
    private _stateCode: CarDriverStateCode;
    private _osmDataProvider: OsmDataProvider;
    private _skipNextFrame = false;

    public get state() {
        return this._state;
    }

    public get stateCode() {
        return this._stateCode;
    }

    public get onStateChanged() {
        return this._onStateChanged.asEvent();
    }

    public get onStateCodeChanged() {
        return this._onStateCodeChanged.asEvent();
    }

    private _setStateCode(newStateCode: CarDriverStateCode) {
        this._stateCode = newStateCode;
        this._onStateCodeChanged.dispatchAsync(newStateCode);
    }

    //TODO restrict public setState
    public setState(newState: Partial<CarDriverState>) {
        this._state = {
            ...this._state,
            ...newState
        };
        this._onStateChanged.dispatchAsync(this._state);
    }

    /**
     * Create a CarDriver
     * @param osmDataProvider osmDataProvider
     */
    constructor(osmDataProvider: OsmDataProvider, initialLocation: CarDriverInitialLocation) {
        (window as any).osm = osmDataProvider; // DEBUG
        (window as any).driver = this;

        this._osmDataProvider = osmDataProvider;
        this._setStateCode(CarDriverStateCode.Stopped);

        this.setState({
            bearing: initialLocation.bearing,
            latlon: initialLocation.location,
            multipleChoices: []
        });
        this.launch(initialLocation);
    }

    public launch(initialLocation: CarDriverInitialLocation) {
        this._setStateCode(CarDriverStateCode.Initializing);

        const callback = (result: [OsmTile, Error | null]) => {
            if (this._osmDataProvider.hasNode(initialLocation.osmNodeID)) {
                this._osmDataProvider.onOsmDataLoaded.unsub(callback);

                const osmLocation = new OsmLocation(this._osmDataProvider.getNode(initialLocation.osmNodeID),
                    this._osmDataProvider.getWay(initialLocation.osmWayID),
                    initialLocation.direction,
                    initialLocation.bearing);

                this._state = {
                    bearing: initialLocation.bearing,
                    multipleChoices: [],
                    currentMovement: new CarDriverMovement(osmLocation, osmLocation),
                    lastNoOneWayLocation: undefined,
                    latlon: initialLocation.location,
                    leftTurnIndicatorActive: false,
                    osmLocation: osmLocation,
                    rightTurnIndicatorActive: false,
                    speed: 1
                };


                this._setStateCode(CarDriverStateCode.Running);
                this._carDriverLoop();
            }
        }

        this._osmDataProvider.onOsmDataLoaded.sub(callback);

    }

    public stop() {
        this._setStateCode(CarDriverStateCode.Stopped);
    }

    /**
     * The user of this class should call this function with the user choice (from multipleChoices) to relaunch car driver 
     * @param choice user choice
     */
    public onUserChoiceFromMultipleChoices(choice: OsmLocation) {
        const { currentMovement } = this._state;
        this.setState({
            currentMovement: new CarDriverMovement(currentMovement.endLocation, choice),
            bearing: choice.bearing,
            multipleChoices: []
        });
        this._setStateCode(CarDriverStateCode.Running);
        this._carDriverLoop();
    }

    private _createNextMovement() {
        const { currentMovement, lastNoOneWayLocation } = this._state;

        const currentLocation = currentMovement.endLocation.clone(this._osmDataProvider);
        let choices = new OsmAvailableDirectionsProvider(currentLocation, this._osmDataProvider, false);
        if (choices.haveNoChoices() && lastNoOneWayLocation) {
            choices = new OsmAvailableDirectionsProvider(lastNoOneWayLocation, this._osmDataProvider, false);
        }

        if (choices.haveNoChoices()) {
            this._setStateCode(CarDriverStateCode.Error);
            return;
        }

        const selectedChoices = this._getSelectedChoices(choices);
        if (selectedChoices.length === 1) {
            this.setState({
                osmLocation: currentMovement.startLocation,
                bearing: selectedChoices[0].bearing,
                currentMovement: new CarDriverMovement(currentMovement.endLocation, selectedChoices[0])
            });
        } else {
            this.setState({
                osmLocation: currentMovement.startLocation,
                multipleChoices: selectedChoices
            });
            this._setStateCode(CarDriverStateCode.WaitingForUserChoice);
        }
    }

    private _getSelectedChoices(choices: OsmAvailableDirectionsProvider) {
        const { leftTurnIndicatorActive, rightTurnIndicatorActive } = this._state;
        if (choices.leftChoices.length && leftTurnIndicatorActive) {
            this.setState({ leftTurnIndicatorActive: false });
            return choices.leftChoices;
        } else if (choices.rightChoices.length && rightTurnIndicatorActive) {
            this.setState({ rightTurnIndicatorActive: false });
            return choices.rightChoices;
        } else if (choices.primaryChoice) {
            return [choices.primaryChoice];
        } else if (choices.leftChoices.length || choices.rightChoices.length) {
            this.setState({ leftTurnIndicatorActive: false });
            this.setState({ rightTurnIndicatorActive: false });
            return choices.leftChoices.concat(choices.rightChoices);
        } else if (choices.turnBackChoice) {
            return [choices.turnBackChoice];
        } else {
            throw new Error("No choices ?");
        }
    }

    private _carDriverLoop = () => {
        const { currentMovement, latlon, speed } = this._state;
        if (this._skipNextFrame) {
            window.setTimeout(this._carDriverLoop, 1000 / 60);
            this._skipNextFrame = false;
            return;
        }

        if (currentMovement.startLocation.way.isRoundabout || currentMovement.endLocation.way.isRoundabout) {
            this._skipNextFrame = true;
        }

        if (currentMovement.endLocation.way.oneWayType === OneWayType.No) {
            this.setState({ lastNoOneWayLocation: currentMovement.endLocation });
        }

        for (let i = 0; i < speed; i++) {
            if (this._stateCode == CarDriverStateCode.Running
                || this._stateCode == CarDriverStateCode.LoadingTile) {
                const currentTileArray: number[] = pointToTile(latlon.lng, latlon.lat, MAP_ZOOM);
                const currentTile = new OsmTile(currentTileArray[0], currentTileArray[1], currentTileArray[2]);
                if (this._osmDataProvider.isTileLoaded(currentTile)) {
                    this._setStateCode(CarDriverStateCode.Running);
                    this._carDriverTick();
                } else {
                    this._setStateCode(CarDriverStateCode.LoadingTile);
                    break;
                }
            }
        }

        if (this._stateCode == CarDriverStateCode.Running
            || this._stateCode == CarDriverStateCode.LoadingTile) {
            window.setTimeout(this._carDriverLoop, 1000 / 60);
        }
    }

    private _carDriverTick = () => {
        const nextMovementFrame = this._state.currentMovement.getNextMovementFrame();
        if (nextMovementFrame) {
            this.setState({latlon: nextMovementFrame});
        } else {
            this._createNextMovement();
        }
    }
}