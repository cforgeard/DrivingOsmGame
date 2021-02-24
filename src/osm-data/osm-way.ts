/**
 * https://wiki.openstreetmap.org/wiki/Key:highway
 */
export enum HighwayType {
    motorway, trunk, primary, secondary, tertiary, unclassified, residential, service,
    motorway_link, trunk_link, primary_link, secondary_link, tertiary_link
}

/**
 * https://wiki.openstreetmap.org/wiki/Key:oneway
 */
export enum OneWayType {
    Yes,       
    No,   
    Reverse 
}

/**
 * An OSM way
 * https://wiki.openstreetmap.org/wiki/Way
 */
export class OsmWay {

    /**
     * highwayType
     */
    public highwayType: HighwayType;

    /**
     * oneWayType
     */
    public oneWayType: OneWayType;

    /**
     * name of the road (ex: Rue des lucioles)
     */
    public name: string | undefined;

    /**
     * ref of the reoad (ex: A84)
     */
    public ref: string | undefined;

    /**
     * true if this way is a roundabout
     */
    public isRoundabout: boolean;

    /**
     * Create an OsmWay object
     * @param id ID
     * @param nodes nodes of the way
     * @param publicAccess true if anyone can go in this way, else false 
     */
    constructor(
        public id: number,
        public nodes: number[],
        public publicAccess: boolean,
        ) { }

    public isLink(): boolean {
        return this.highwayType === HighwayType.motorway_link ||
            this.highwayType === HighwayType.trunk_link ||
            this.highwayType === HighwayType.primary_link ||
            this.highwayType === HighwayType.secondary_link ||
            this.highwayType === HighwayType.tertiary_link;
    }

    public getPreviousNodeID(currentNodeID: number): number | undefined {
        return this.nodes[this.nodes.indexOf(currentNodeID) - 1];
    }

    public getNextNodeID(currentNodeID: number): number | undefined {
        return this.nodes[this.nodes.indexOf(currentNodeID) + 1];
    }
}