import { latlon } from "sgeo";

/**
 * Class used by the CarDriver to know its initial location
 */
export class CarDriverInitialLocation {

    /**
     * Create a CarDriverInitialLocation object
     * @param location location (lat/lon)
     * @param osmNodeID osmNodeID
     * @param osmWayID osmWayID
     * @param direction if true, direction is from the first node of the way to the last node
     *                  if false, direction is from the last node of the way to the first node
     * @param bearing bearing, in degrees
     */
    constructor(public location: latlon, public osmNodeID: number, public osmWayID: number, public direction: boolean, public bearing: number) { }
}