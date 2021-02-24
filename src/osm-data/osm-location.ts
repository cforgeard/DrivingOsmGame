import { OsmNode } from "./osm-node";
import { OsmWay, OneWayType } from "./osm-way";
import { OsmDataProvider } from "./osm-data-provider";


export class OsmLocation {

    /**
     * Create an OsmLocation object
     * @param node Osm Node
     * @param way Osm Way
     * @param direction if true, direction is from the first node of the way to the last node
     *                  if false, direction is from the last node of the way to the first node
     * @param bearing bearing, in degrees
     */
    constructor(public node: OsmNode, public way: OsmWay, public direction: boolean, public bearing: number) { }

    /**
     * Check if this choice is valid
     * @param allowNonPublicChoices if true, the program don't check if anyone can go in the node or the way
     * @returns true if this choice is valid, false otherwise
     */
    public isValid(allowNonPublicChoices: boolean) {
        if (this.way.oneWayType === OneWayType.Yes && !this.direction) {
            return false;
        } else if (this.way.oneWayType === OneWayType.Reverse && this.direction) {
            return false;
        }
        
        if (!allowNonPublicChoices) {
            if (!this.way.publicAccess || !this.node.publicAccess) {
                return false;
            }
        }

        return true;
    }

    /**
     * Return true if this location is right of an other location
     * @param other other location
     */
    public isRightOf(other: OsmLocation) {
        if ((this.bearing + 180) > 360) {
            return (other.bearing > this.bearing || other.bearing < this.bearing - 180);
        } else {
            return (other.bearing > this.bearing && other.bearing < this.bearing + 180);
        }
    }

    /**
     * Return the difference of bearing between current bearing and other bearing
     * @param other other
     */
    public getBearingDiff(other: OsmLocation) {
        if (this.bearing > other.bearing) {
            return Math.min((360 - this.bearing) + other.bearing, this.bearing - other.bearing);
        } else if (other.bearing > this.bearing) {
            return Math.min((360 - other.bearing) + this.bearing, other.bearing - this.bearing);
        } else {
            return 0;
        }
    }

    /**
     * Clone this object
     * @param osmDataProvider 
     */
    public clone(osmDataProvider: OsmDataProvider){
        return new OsmLocation(osmDataProvider.getNode(this.node.id), osmDataProvider.getWay(this.way.id), this.direction, this.bearing);
    }
}