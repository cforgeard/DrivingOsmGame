import { latlon } from "sgeo";
import { OsmLocation } from "../osm-data/osm-location";

/**
 * Class used by the CarDriver to animate a movement (interpolation) between two OsmLocations
 */
export class CarDriverMovement {

    public readonly startLocation: OsmLocation;
    public readonly endLocation: OsmLocation;
    public _remainingMovementFrames: latlon[];

    constructor(startLocation: OsmLocation, endLocation: OsmLocation){
        this.startLocation = startLocation;
        this.endLocation = endLocation;

        const distance = startLocation.node.distanceTo(this.endLocation.node);
        this._remainingMovementFrames = startLocation.node.interpolate(endLocation.node, distance / 0.0002);
    }

    public getNextMovementFrame() {
        return this._remainingMovementFrames.shift();
    }
}