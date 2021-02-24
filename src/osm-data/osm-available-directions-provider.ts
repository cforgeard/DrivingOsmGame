import { OsmLocation } from "./osm-location";
import { OsmDataProvider } from "./osm-data-provider";
import { OneWayType, OsmWay } from "./osm-way";

/**
 * Class for computing possible directions from an OSM location
 */
export class OsmAvailableDirectionsProvider {

    public primaryChoice: OsmLocation | undefined;
    public turnBackChoice: OsmLocation | undefined;
    public leftChoices: OsmLocation[];
    public rightChoices: OsmLocation[];

    private _currentLoc: OsmLocation;
    private _osmDataProvider: OsmDataProvider;

    /**
     * If true, the program don't check if anyone can go in the node or the way
     */
    private _allowNonPublicChoices: boolean;

    /**
     * Create an OsmDirections object
     * @param currentLoc Current location
     * @param osmDataProvider Osm Data Provider 
     * @param allowNonPublicChoices If true, the program don't check if anyone can go in the node or the way
     */
    constructor(currentLoc: OsmLocation, osmDataProvider: OsmDataProvider, allowNonPublicChoices: boolean) {
        this._currentLoc = currentLoc;
        this._osmDataProvider = osmDataProvider;
        this._allowNonPublicChoices = allowNonPublicChoices;
        this.primaryChoice = undefined;
        this.leftChoices = [];
        this.rightChoices = [];

        this._addChoiceFromCurrentWayIfPossible();
        for (const wayId of this._currentLoc.node.ways.filter(value => value !== this._currentLoc.way.id)) {
            this._addChoicesFromOtherWayIfPossible(osmDataProvider.getWay(wayId));
        }

        this._fixBadChoices();

        if (!this.primaryChoice && (this.leftChoices.length || this.rightChoices.length)) {
            this._findAlternativeForPrimaryChoice();
        }

        if (this._currentLoc.way.oneWayType === OneWayType.No) {
            this.turnBackChoice = this._currentLoc;
            this.turnBackChoice.direction = !this.turnBackChoice.direction;
        }
    }

    public haveNoChoices() {
        return !this.primaryChoice && !this.turnBackChoice && !this.leftChoices.length && !this.rightChoices.length;
    }

    private _addChoiceFromCurrentWayIfPossible() {
        let primaryChoiceNodeID: number | undefined;

        if (this._currentLoc.direction) {
            primaryChoiceNodeID = this._currentLoc.way.getNextNodeID(this._currentLoc.node.id);
        } else {
            primaryChoiceNodeID = this._currentLoc.way.getPreviousNodeID(this._currentLoc.node.id);
        }

        if (primaryChoiceNodeID) {
            const node = this._osmDataProvider.getNode(primaryChoiceNodeID);
            this.primaryChoice = new OsmLocation(node, this._currentLoc.way, this._currentLoc.direction, this._currentLoc.node.bearingTo(node));
        }
    }

    private _addChoicesFromOtherWayIfPossible(way: OsmWay) {
        const previousNodeID = way.getPreviousNodeID(this._currentLoc.node.id);
        const nextNodeID = way.getNextNodeID(this._currentLoc.node.id);

        for (const nodeID of [previousNodeID, nextNodeID]) {
            if (!nodeID) { continue; }
            const node = this._osmDataProvider.getNode(nodeID);
            const location = new OsmLocation(node, way, (nodeID === nextNodeID), this._currentLoc.node.finalBearingTo(node))

            if (this._currentLoc.isRightOf(location)) {
                this.rightChoices.push(location);
            } else {
                this.leftChoices.push(location);
            }
        }
    }
 
    private _findAlternativeForPrimaryChoice() {
        let candidates = this.leftChoices.concat(this.rightChoices).filter(item => {
            return item.way.highwayType === this._currentLoc.way.highwayType && this._currentLoc.getBearingDiff(item) < 100 && (
                item.way.name === this._currentLoc.way.name || item.way.ref === this._currentLoc.way.ref
            )
        });

        if (candidates.length === 0){
            candidates = this.leftChoices.concat(this.rightChoices).filter(item => this._currentLoc.getBearingDiff(item) < 30);
        }
        if (candidates.length === 0) { return; }

        const bestCandidate = this._findBestAlternativeForPrimaryChoice(candidates);
        this.rightChoices = this.rightChoices.filter(item => item !== bestCandidate);
        this.leftChoices = this.leftChoices.filter(item => item !== bestCandidate);
        this.primaryChoice = bestCandidate;
        return;
    }

    private _findBestAlternativeForPrimaryChoice(candidates: OsmLocation[]) {
        let bestDiff = this._currentLoc.getBearingDiff(candidates[0]);
        let bestCandidate = candidates[0];

        for (let i = 1; i < candidates.length; i++) {
            const diff = this._currentLoc.getBearingDiff(candidates[i]);
            if (diff < bestDiff) {
                bestDiff = diff;
                bestCandidate = candidates[i];
            }
        }

        return bestCandidate;
    }

    private _fixBadChoices() {
        if (this.primaryChoice && !this.primaryChoice.isValid(this._allowNonPublicChoices)) {
            this.primaryChoice = undefined;
        }

        this.leftChoices = this.leftChoices.filter(item => item.isValid(this._allowNonPublicChoices));
        this.rightChoices = this.rightChoices.filter(item => item.isValid(this._allowNonPublicChoices));

        if (this._currentLoc.way.isRoundabout && this.leftChoices.length !== 0) {
            this.rightChoices = this.rightChoices.concat(this.leftChoices);
            this.leftChoices = [];
        }

        for (let i = 0; i < this.rightChoices.length; i++) {
            if (this.rightChoices[i].way.isRoundabout) {
                this.primaryChoice = this.rightChoices[i];
                this.rightChoices.splice(i, 1);
                break;
            }
        }
    }

}